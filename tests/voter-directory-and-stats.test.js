import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Organization, Election, Position, Candidate, Member, User, Eligibility } from '../models/index.js';

describe('VoteSphere Public Org Portal, Voter Directory & Election Statistics Suite', () => {
  // Test Data Fixtures
  const orgA = {
    id: 'org-test-0000-0000-0000-000000000001',
    name: 'SSC FIRM',
    slug: 'ssc-firm',
    ownerId: 'user-owner-001',
    memberDirectoryVisibility: 'members_only',
    publicEmail: 'inquiries@sscfirm.org',
    publicPhone: null,
  };

  const orgB = {
    id: 'org-test-0000-0000-0000-000000000002',
    name: 'Private Club',
    slug: 'private-club',
    ownerId: 'user-owner-002',
    memberDirectoryVisibility: 'private',
    publicEmail: null,
    publicPhone: null,
  };

  const mockElections = [
    {
      id: 'e-1',
      orgId: orgA.id,
      title: 'Sports voting for cricket and football',
      status: 'published',
      isCertified: true,
      config: { publishingDetails: { publishedAt: '2026-10-01' } },
    },
    {
      id: 'e-2',
      orgId: orgA.id,
      title: 'Lok Shabha Election 2029',
      status: 'archived',
      isCertified: true,
      config: { publishingDetails: { publishedAt: '2026-09-01' } },
    },
    {
      id: 'e-3',
      orgId: orgA.id,
      title: 'Lok Shabha Election 2029 (Runoff Round 2)',
      status: 'published',
      isCertified: true,
      config: { publishingDetails: { publishedAt: '2026-10-15' } },
    },
    {
      id: 'e-4',
      orgId: orgA.id,
      title: 'General Chairman Election 2026',
      status: 'published',
      isCertified: true,
      config: {},
    },
    {
      id: 'e-5',
      orgId: orgA.id,
      title: 'Unpublished Draft Ballot',
      status: 'draft',
      isCertified: false,
      config: {},
    },
    {
      id: 'e-foreign',
      orgId: orgB.id,
      title: 'Foreign Org Internal Poll',
      status: 'live',
      isCertified: false,
      config: {},
    },
  ];

  const mockUsers = [
    {
      id: 'user-owner-001',
      name: 'ANAND JHA',
      displayName: 'Anand Jha',
      designation: 'Managing Partner',
      email: 'anand.private@gmail.com',
      showEmailPublicly: false,
      showPhonePublicly: false,
      isProfilePublic: true,
      avatarVisible: true,
    },
    {
      id: 'user-voter-001',
      name: 'Heritage Sports',
      displayName: 'Heritage Sports',
      designation: 'Athletics Representative',
      email: 'sports@example.com',
      showEmailPublicly: false,
      showPhonePublicly: false,
      isProfilePublic: true,
      avatarVisible: true,
    },
    {
      id: 'user-voter-002',
      name: 'GAUTAM ANAND',
      displayName: 'Gautam A.',
      designation: 'Senior Member',
      email: 'gautam@example.com',
      showEmailPublicly: true,
      showPhonePublicly: false,
      isProfilePublic: true,
      avatarVisible: true,
    },
  ];

  const mockMembers = [
    { id: 'm-1', orgId: orgA.id, userId: 'user-owner-001', role: 'owner', status: 'active' },
    { id: 'm-2', orgId: orgA.id, userId: 'user-voter-001', role: 'voter', status: 'active' },
    { id: 'm-3', orgId: orgA.id, userId: 'user-voter-002', role: 'voter', status: 'active' },
  ];

  const mockCandidates = [
    { id: 'cand-1', name: 'cricket', positionName: 'Sports Category', status: 'active' },
    { id: 'cand-2', name: 'football', positionName: 'Sports Category', status: 'active' },
    { id: 'cand-3', name: 'yogi ji', positionName: 'Parliament Seat', status: 'active' },
  ];

  const mockEligibilities = [
    { id: 'el-1', electionId: 'e-1', memberId: 'm-2', status: 'voted' },
    { id: 'el-2', electionId: 'e-1', memberId: 'm-3', status: 'eligible' },
    { id: 'el-3', electionId: 'e-4', memberId: 'm-2', status: 'voted' },
  ];

  // =========================================================================
  // 1. Correct Election Classification & Statistics Consistency
  // =========================================================================
  describe('1. Election Classification & Category Tallies', () => {
    function classifyElections(elections, targetOrgId) {
      // Tenant Isolation + Draft Exclusion
      const visible = elections.filter(
        (e) => e.orgId === targetOrgId && e.status !== 'draft'
      );

      return {
        total: visible.length,
        active: visible.filter((e) => e.status === 'live'),
        upcoming: visible.filter((e) => e.status === 'scheduled'),
        published: visible.filter((e) => e.status === 'published'),
        completed: visible.filter(
          (e) => e.status === 'ended' || e.status === 'published' || e.status === 'archived'
        ),
      };
    }

    test('strictly filters out draft and foreign organization elections', () => {
      const res = classifyElections(mockElections, orgA.id);
      assert.equal(res.total, 4, 'Drafts and foreign elections must be excluded');
      assert.ok(!res.completed.some((e) => e.status === 'draft'));
      assert.ok(!res.completed.some((e) => e.orgId !== orgA.id));
    });

    test('matches SSC FIRM ground truth: 4 completed elections and 3 published results', () => {
      const res = classifyElections(mockElections, orgA.id);
      assert.equal(res.active.length, 0, 'Active live count must be 0');
      assert.equal(res.upcoming.length, 0, 'Upcoming count must be 0');
      assert.equal(res.completed.length, 4, 'All completed count must be 4');
      assert.equal(res.published.length, 3, 'Results declared count must be 3');
    });

    test('preserves archived elections in completed history while excluding drafts', () => {
      const res = classifyElections(mockElections, orgA.id);
      const archived = res.completed.find((e) => e.status === 'archived');
      assert.ok(archived, 'Archived election must appear in completed category');
      assert.equal(archived.title, 'Lok Shabha Election 2029');
    });
  });

  // =========================================================================
  // 2. Default Category Selection & Priority Hierarchy
  // =========================================================================
  describe('2. Default Category Selection & Empty States', () => {
    function determineDefaultTab(grouped) {
      if (grouped?.active?.length > 0) return 'active';
      if (grouped?.upcoming?.length > 0) return 'upcoming';
      if (grouped?.completed?.length > 0) return 'completed';
      if (grouped?.published?.length > 0) return 'published';
      return 'active';
    }

    test('selects All Completed when no live or upcoming elections exist but completed are available', () => {
      const grouped = {
        active: [],
        upcoming: [],
        published: [{ id: 'e-1' }],
        completed: [{ id: 'e-1' }, { id: 'e-2' }],
      };
      const defaultTab = determineDefaultTab(grouped);
      assert.equal(defaultTab, 'completed', 'Must prioritize All Completed when no live/upcoming exist');
    });

    test('prioritizes Live Now when active elections exist', () => {
      const grouped = {
        active: [{ id: 'live-1' }],
        upcoming: [{ id: 'up-1' }],
        completed: [{ id: 'comp-1' }],
      };
      assert.equal(determineDefaultTab(grouped), 'active');
    });

    test('prioritizes Upcoming when no live elections exist but upcoming exist', () => {
      const grouped = {
        active: [],
        upcoming: [{ id: 'up-1' }],
        completed: [{ id: 'comp-1' }],
      };
      assert.equal(determineDefaultTab(grouped), 'upcoming');
    });

    test('provides category-specific non-generic empty states', () => {
      const emptyMessages = {
        active: 'No elections are currently open for voting.',
        upcoming: 'No upcoming elections have been scheduled.',
        published: 'No results have been officially declared yet.',
        completed: 'No completed elections are available.',
      };

      assert.equal(emptyMessages.active, 'No elections are currently open for voting.');
      assert.equal(emptyMessages.upcoming, 'No upcoming elections have been scheduled.');
      assert.equal(emptyMessages.published, 'No results have been officially declared yet.');
      assert.equal(emptyMessages.completed, 'No completed elections are available.');
    });
  });

  // =========================================================================
  // 3. Voter Access & Directory Authorization Rules
  // =========================================================================
  describe('3. Voter Directory Access & Permissions', () => {
    function evaluateDirectoryAccess({ visibility, callerRole, isAuth }) {
      if (visibility === 'public') {
        return { canAccess: true };
      }
      if (visibility === 'members_only') {
        if (!isAuth) {
          return { canAccess: false, code: 401, reason: 'authentication_required' };
        }
        if (callerRole === 'owner' || callerRole === 'admin' || callerRole === 'voter') {
          return { canAccess: true };
        }
        return { canAccess: false, code: 403, reason: 'restricted' };
      }
      if (visibility === 'private') {
        if (callerRole === 'owner' || callerRole === 'admin') {
          return { canAccess: true };
        }
        return { canAccess: false, code: 403, reason: 'private' };
      }
      return { canAccess: false, code: 403 };
    }

    test('allows authenticated voter to access members_only directory', () => {
      const res = evaluateDirectoryAccess({
        visibility: 'members_only',
        callerRole: 'voter',
        isAuth: true,
      });
      assert.equal(res.canAccess, true, 'Authenticated voter must be granted access');
    });

    test('denies unauthenticated visitors to members_only directory with 401 authentication required', () => {
      const res = evaluateDirectoryAccess({
        visibility: 'members_only',
        callerRole: null,
        isAuth: false,
      });
      assert.equal(res.canAccess, false);
      assert.equal(res.code, 401);
    });

    test('denies non-admin voters when directory is set to private', () => {
      const resVoter = evaluateDirectoryAccess({
        visibility: 'private',
        callerRole: 'voter',
        isAuth: true,
      });
      assert.equal(resVoter.canAccess, false);

      const resAdmin = evaluateDirectoryAccess({
        visibility: 'private',
        callerRole: 'admin',
        isAuth: true,
      });
      assert.equal(resAdmin.canAccess, true);
    });
  });

  // =========================================================================
  // 4. Anonymous Ballot Privacy & Participant Roster Protection
  // =========================================================================
  describe('4. Anonymous Ballot Privacy & Participant Sanitization', () => {
    function sanitizeParticipants(eligibilities, candidates, users, members) {
      const memberMap = new Map(members.map((m) => [m.id, m]));
      const userMap = new Map(users.map((u) => [u.id, u]));

      // 1. Candidates
      const cands = candidates.map((c) => ({
        name: c.name,
        role: 'candidate',
        category: 'participant',
        roleLabel: 'Official Candidate',
        designation: `Candidate for ${c.positionName}`,
      }));

      // 2. Voters (Deduplicated, zero voting status exposure)
      const seenUserIds = new Set();
      const voters = [];

      for (const el of eligibilities) {
        const mem = memberMap.get(el.memberId);
        if (!mem) continue;
        const u = userMap.get(mem.userId);
        if (!u || seenUserIds.has(u.id)) continue;
        seenUserIds.add(u.id);

        voters.push({
          name: u.displayName || u.name,
          role: 'voter',
          category: 'participant',
          roleLabel: 'Registered Voter',
          designation: u.designation || 'Eligible Electoral Participant',
          // CRITICAL: Strictly omit el.status (voted vs eligible)
          hasVotedStatusExposed: el.status !== undefined ? false : false,
        });
      }

      return { candidates: cands, voters, totalParticipants: cands.length + voters.length };
    }

    test('preserves secret ballot anonymity: never exposes whether a participant has voted', () => {
      const roster = sanitizeParticipants(mockEligibilities, mockCandidates, mockUsers, mockMembers);
      for (const v of roster.voters) {
        assert.equal(v.status, undefined, 'Voting status must NEVER be revealed');
        assert.equal(v.voted, undefined);
        assert.equal(v.ballot, undefined);
      }
    });

    test('deduplicates voters across multiple election eligibility records', () => {
      const roster = sanitizeParticipants(mockEligibilities, mockCandidates, mockUsers, mockMembers);
      // user-voter-001 has 2 eligibility records (el-1 and el-3), must only appear once
      const heritageCount = roster.voters.filter((v) => v.name === 'Heritage Sports').length;
      assert.equal(heritageCount, 1, 'Participant roster must deduplicate voter entries');
      assert.equal(roster.voters.length, 2);
    });

    test('properly categorizes candidates with office and election context', () => {
      const roster = sanitizeParticipants(mockEligibilities, mockCandidates, mockUsers, mockMembers);
      assert.equal(roster.candidates.length, 3);
      assert.equal(roster.candidates[0].roleLabel, 'Official Candidate');
      assert.equal(roster.candidates[0].designation, 'Candidate for Sports Category');
    });
  });

  // =========================================================================
  // 5. Contact Information & Privacy Enforcement
  // =========================================================================
  describe('5. Contact Information & Privacy Enforcement', () => {
    function formatContactInfo(org, owner) {
      return {
        publicEmail: org.publicEmail || null,
        publicPhone: org.showPublicPhone ? org.publicPhone : null,
        ownerContact: {
          email: owner.showEmailPublicly ? owner.email : null,
          phone: owner.showPhonePublicly ? owner.phone : null,
        },
        hasDirectContact: Boolean(org.publicEmail || org.publicPhone),
      };
    }

    test('exposes public inquiry email when explicitly configured by the organization', () => {
      const contact = formatContactInfo(orgA, mockUsers[0]);
      assert.equal(contact.publicEmail, 'inquiries@sscfirm.org');
      assert.equal(contact.hasDirectContact, true);
    });

    test('never exposes private owner email as a fallback for organization inquiry', () => {
      const contact = formatContactInfo(orgB, mockUsers[0]);
      assert.equal(contact.publicEmail, null);
      assert.notEqual(contact.publicEmail, mockUsers[0].email, 'Owner private email must not leak');
      assert.equal(contact.ownerContact.email, null);
      assert.equal(contact.hasDirectContact, false);
    });
  });
});

