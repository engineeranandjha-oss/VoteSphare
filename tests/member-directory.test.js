import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { User, Member } from '../models/index.js';

describe('VoteSphere Module 2: Organization Member Directory Test Suite', () => {
  // 1. User Model Schema for Profile & Directory
  describe('1. User Model Schema Extensions', () => {
    test('verifies User model has all new profile and privacy fields', () => {
      const attrs = User.rawAttributes;
      assert.ok(attrs.displayName, 'displayName must exist');
      assert.ok(attrs.designation, 'designation must exist');
      assert.ok(attrs.bio, 'bio must exist');
      assert.ok(attrs.phone, 'phone must exist');
      assert.ok(attrs.showEmailPublicly, 'showEmailPublicly must exist');
      assert.ok(attrs.showPhonePublicly, 'showPhonePublicly must exist');
      assert.ok(attrs.isProfilePublic, 'isProfilePublic must exist');
      assert.ok(attrs.avatarVisible, 'avatarVisible must exist');
      assert.ok(attrs.notificationPreferences, 'notificationPreferences must exist');
    });

    test('verifies default values for privacy toggles', () => {
      assert.equal(User.rawAttributes.showEmailPublicly.defaultValue, false);
      assert.equal(User.rawAttributes.showPhonePublicly.defaultValue, false);
      assert.equal(User.rawAttributes.isProfilePublic.defaultValue, true);
      assert.equal(User.rawAttributes.avatarVisible.defaultValue, true);
    });
  });

  // 2. Member Directory Filtering, Search and Sort Logic
  describe('2. Member Search, Role Filtering, and Sorting', () => {
    const mockMembers = [
      {
        id: 'm-1',
        role: 'owner',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        user: {
          id: 'u-1',
          name: 'Charlie Davis',
          displayName: 'Charlie',
          designation: 'Chairperson',
        },
      },
      {
        id: 'm-2',
        role: 'admin',
        status: 'active',
        createdAt: '2026-02-01T00:00:00Z',
        user: {
          id: 'u-2',
          name: 'Alice Baker',
          displayName: 'Alice B.',
          designation: 'Election Director',
        },
      },
      {
        id: 'm-3',
        role: 'voter',
        status: 'active',
        createdAt: '2026-03-01T00:00:00Z',
        user: {
          id: 'u-3',
          name: 'Bob Adams',
          displayName: 'Bob A.',
          designation: 'General Voter',
        },
      },
    ];

    function searchAndFilter(members, { search = '', role = 'all', sortBy = 'name', sortOrder = 'asc' }) {
      let filtered = members.filter((m) => m.status === 'active');

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.user.name.toLowerCase().includes(q) ||
            (m.user.displayName && m.user.displayName.toLowerCase().includes(q)) ||
            (m.user.designation && m.user.designation.toLowerCase().includes(q))
        );
      }

      if (role && role !== 'all') {
        filtered = filtered.filter((m) => m.role === role);
      }

      filtered.sort((a, b) => {
        if (sortBy === 'name') {
          const nameA = a.user.displayName || a.user.name;
          const nameB = b.user.displayName || b.user.name;
          return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        if (sortBy === 'joinedAt') {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return 0;
      });

      return filtered;
    }

    test('searches members by name and designation', () => {
      const resultName = searchAndFilter(mockMembers, { search: 'Alice' });
      assert.equal(resultName.length, 1);
      assert.equal(resultName[0].user.name, 'Alice Baker');

      const resultDesig = searchAndFilter(mockMembers, { search: 'Chairperson' });
      assert.equal(resultDesig.length, 1);
      assert.equal(resultDesig[0].user.name, 'Charlie Davis');
    });

    test('filters members strictly by role', () => {
      const admins = searchAndFilter(mockMembers, { role: 'admin' });
      assert.equal(admins.length, 1);
      assert.equal(admins[0].role, 'admin');

      const voters = searchAndFilter(mockMembers, { role: 'voter' });
      assert.equal(voters.length, 1);
      assert.equal(voters[0].role, 'voter');
    });

    test('sorts members alphabetically ascending and descending', () => {
      const sortedAsc = searchAndFilter(mockMembers, { sortBy: 'name', sortOrder: 'asc' });
      assert.equal(sortedAsc[0].user.displayName, 'Alice B.');
      assert.equal(sortedAsc[1].user.displayName, 'Bob A.');
      assert.equal(sortedAsc[2].user.displayName, 'Charlie');

      const sortedDesc = searchAndFilter(mockMembers, { sortBy: 'name', sortOrder: 'desc' });
      assert.equal(sortedDesc[0].user.displayName, 'Charlie');
      assert.equal(sortedDesc[2].user.displayName, 'Alice B.');
    });

    test('sorts members by joinedAt date', () => {
      const sortedJoined = searchAndFilter(mockMembers, { sortBy: 'joinedAt', sortOrder: 'desc' });
      assert.equal(sortedJoined[0].user.name, 'Bob Adams', 'Most recently joined first');
    });
  });

  // 3. Privacy Redaction Based on Directory Visibility
  describe('3. Privacy Redaction & Access Enforcement', () => {
    function sanitizeMemberForCaller(member, callerRole, visibility) {
      if (visibility === 'private' && callerRole !== 'owner' && callerRole !== 'admin') {
        throw new Error('Directory is private');
      }

      const isManager = callerRole === 'owner' || callerRole === 'admin';
      return {
        id: member.id,
        role: member.role,
        displayName: member.user.displayName || member.user.name,
        designation: member.user.designation || null,
        email: isManager || member.user.showEmailPublicly ? member.user.email : null,
        phone: isManager || member.user.showPhonePublicly ? member.user.phone : null,
      };
    }

    const testMember = {
      id: 'm-1',
      role: 'voter',
      user: {
        name: 'Secret Voter',
        displayName: 'Voter S',
        email: 'secret@voter.org',
        phone: '+1-555-9999',
        showEmailPublicly: false,
        showPhonePublicly: false,
      },
    };

    test('redacts email and phone for non-admin viewers when user flags are false', () => {
      const sanitized = sanitizeMemberForCaller(testMember, 'voter', 'members_only');
      assert.equal(sanitized.email, null, 'Email must be hidden from regular members');
      assert.equal(sanitized.phone, null, 'Phone must be hidden from regular members');
      assert.equal(sanitized.displayName, 'Voter S');
    });

    test('exposes member contact details to organization managers for administrative communication', () => {
      const sanitized = sanitizeMemberForCaller(testMember, 'admin', 'members_only');
      assert.equal(sanitized.email, 'secret@voter.org');
      assert.equal(sanitized.phone, '+1-555-9999');
    });

    test('throws error if regular voter attempts to view directory when visibility is private', () => {
      assert.throws(
        () => sanitizeMemberForCaller(testMember, 'voter', 'private'),
        /Directory is private/
      );
    });
  });
});

