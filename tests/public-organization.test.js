import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Organization, User, Election } from '../models/index.js';

describe('VoteSphere Module 1: Public Organization Profile & Transparency Test Suite', () => {
  // 1. Model Schema Integrity
  describe('1. Organization Model Schema Integrity', () => {
    test('verifies Organization model contains all required transparency fields', () => {
      const attrs = Organization.rawAttributes;
      assert.ok(attrs.coverImage, 'coverImage must exist');
      assert.ok(attrs.website, 'website must exist');
      assert.ok(attrs.publicEmail, 'publicEmail must exist');
      assert.ok(attrs.publicPhone, 'publicPhone must exist');
      assert.ok(attrs.showPublicPhone, 'showPublicPhone must exist');
      assert.ok(attrs.location, 'location must exist');
      assert.ok(attrs.establishedDate, 'establishedDate must exist');
      assert.ok(attrs.isVerified, 'isVerified must exist');
      assert.ok(attrs.memberDirectoryVisibility, 'memberDirectoryVisibility must exist');
      assert.ok(attrs.signatoryName, 'signatoryName must exist');
      assert.ok(attrs.signatoryTitle, 'signatoryTitle must exist');
    });

    test('verifies memberDirectoryVisibility default and allowed ENUM values', () => {
      const attr = Organization.rawAttributes.memberDirectoryVisibility;
      assert.equal(attr.defaultValue, 'members_only');
      assert.deepEqual(attr.values, ['private', 'members_only', 'public']);
    });
  });

  // 2. Owner Privacy & Contact Sanitization
  describe('2. Owner Privacy & Contact Sanitization', () => {
    const mockOwner = {
      id: 'user-uuid-1',
      name: 'Dr. Jane Doe',
      displayName: 'Jane Doe, Ph.D.',
      designation: 'Faculty Dean',
      bio: 'Leading democratic integrity initiatives.',
      email: 'jane.private@university.edu',
      phone: '+1-555-0199',
      image: 'https://example.com/avatar.jpg',
      showEmailPublicly: false,
      showPhonePublicly: false,
      isProfilePublic: true,
      avatarVisible: true,
    };

    function sanitizeOwner(owner) {
      if (!owner || owner.isProfilePublic === false) return null;
      return {
        id: owner.id,
        name: owner.displayName || owner.name,
        designation: owner.designation || 'Organization Official',
        bio: owner.bio,
        image: owner.avatarVisible ? owner.image : null,
        publicEmail: owner.showEmailPublicly ? owner.email : null,
        publicPhone: owner.showPhonePublicly ? owner.phone : null,
      };
    }

    test('owner email and phone are strictly hidden when showEmailPublicly/showPhonePublicly are false', () => {
      const sanitized = sanitizeOwner(mockOwner);
      assert.equal(sanitized.name, 'Jane Doe, Ph.D.');
      assert.equal(sanitized.designation, 'Faculty Dean');
      assert.equal(sanitized.publicEmail, null, 'Private email must not be exposed');
      assert.equal(sanitized.publicPhone, null, 'Private phone must not be exposed');
      assert.equal(sanitized.image, 'https://example.com/avatar.jpg');
    });

    test('owner email is exposed only when showEmailPublicly is explicitly true', () => {
      const sanitized = sanitizeOwner({ ...mockOwner, showEmailPublicly: true });
      assert.equal(sanitized.publicEmail, 'jane.private@university.edu');
      assert.equal(sanitized.publicPhone, null);
    });

    test('owner is completely redacted when isProfilePublic is false', () => {
      const sanitized = sanitizeOwner({ ...mockOwner, isProfilePublic: false });
      assert.equal(sanitized, null, 'Owner info must be omitted if profile is private');
    });
  });

  // 3. Draft Election Exclusion from Public Endpoints
  describe('3. Public Election Filtering & Strict Draft Exclusion', () => {
    const mockElections = [
      { id: 'e-1', title: 'Presidential Ballot 2026', status: 'live' },
      { id: 'e-2', title: 'Scheduled Senate Vote', status: 'scheduled' },
      { id: 'e-3', title: 'Unpublished Internal Ballot', status: 'draft' },
      { id: 'e-4', title: 'Certified Annual Results', status: 'published' },
      { id: 'e-5', title: 'Concluded Vote Awaiting Certification', status: 'ended' },
    ];

    function filterPublicElections(elections) {
      // Must strictly exclude 'draft'
      const publicAllowed = elections.filter((e) => e.status !== 'draft');
      const active = publicAllowed.filter((e) => e.status === 'live');
      const upcoming = publicAllowed.filter((e) => e.status === 'scheduled');
      const completed = publicAllowed.filter(
        (e) => e.status === 'published' || e.status === 'ended' || e.status === 'archived'
      );
      return { active, upcoming, completed, allPublic: publicAllowed };
    }

    test('strictly excludes draft elections from public listings', () => {
      const result = filterPublicElections(mockElections);
      const containsDraft = result.allPublic.some((e) => e.status === 'draft');
      assert.equal(containsDraft, false, 'Draft elections must NEVER appear in public listings');
      assert.equal(result.allPublic.length, 4);
    });

    test('properly categorizes live, scheduled, and completed public elections', () => {
      const result = filterPublicElections(mockElections);
      assert.equal(result.active.length, 1);
      assert.equal(result.active[0].title, 'Presidential Ballot 2026');
      assert.equal(result.upcoming.length, 1);
      assert.equal(result.upcoming[0].title, 'Scheduled Senate Vote');
      assert.equal(result.completed.length, 2);
    });
  });

  // 4. Aggregated Statistics Calculation
  describe('4. Aggregated Public Statistics Calculation', () => {
    test('computes privacy-safe public election telemetry', () => {
      const elections = [
        { status: 'live' },
        { status: 'scheduled' },
        { status: 'published' },
        { status: 'published' },
        { status: 'draft' }, // Excluded from stats
      ];

      const nonDraftElections = elections.filter((e) => e.status !== 'draft');
      const stats = {
        totalElections: nonDraftElections.length,
        activeElections: nonDraftElections.filter((e) => e.status === 'live').length,
        upcomingElections: nonDraftElections.filter((e) => e.status === 'scheduled').length,
        completedElections: nonDraftElections.filter(
          (e) => e.status === 'published' || e.status === 'ended'
        ).length,
      };

      assert.equal(stats.totalElections, 4);
      assert.equal(stats.activeElections, 1);
      assert.equal(stats.upcomingElections, 1);
      assert.equal(stats.completedElections, 2);
    });
  });
});

