import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateBlindHash } from '../lib/voting/anonymity.js';

describe('VoteSphere Module 4: Profile Redesign & Workspace Subpages Test Suite', () => {
  // 1. Cryptographic Voter Fingerprint Generation
  describe('1. Cryptographic Identity & Blind Hash Generation', () => {
    test('generates deterministic 64-char SHA-256 voter fingerprint from userId', () => {
      const userId = 'u-00000000-0000-4000-a000-000000000001';
      const fp1 = generateBlindHash(userId);
      const fp2 = generateBlindHash(userId);

      assert.equal(typeof fp1, 'string');
      assert.equal(fp1.length, 64, 'SHA-256 hexadecimal output must be 64 characters');
      assert.equal(fp1, fp2, 'Fingerprint generation must be deterministic for identical inputs');
    });

    test('generates distinct fingerprints for distinct user IDs', () => {
      const userA = 'u-00000000-0000-4000-a000-000000000001';
      const userB = 'u-00000000-0000-4000-a000-000000000002';

      const fpA = generateBlindHash(userA);
      const fpB = generateBlindHash(userB);

      assert.notEqual(fpA, fpB, 'Different users must possess distinct cryptographic fingerprints');
    });
  });

  // 2. Profile Attributes & Privacy Mutation Validation
  describe('2. Profile Validation & Update Processing', () => {
    const mockDbUser = {
      id: 'u-1',
      name: 'Eleanor Vance',
      displayName: null,
      designation: null,
      bio: null,
      phone: null,
      showEmailPublicly: false,
      showPhonePublicly: false,
      isProfilePublic: true,
      avatarVisible: true,
      notificationPreferences: {
        emailInvites: true,
        turnoutUpdates: false,
        resultsPublished: true,
        billingUpdates: true,
      },
      update(fields) {
        Object.assign(this, fields);
        return Promise.resolve(this);
      },
    };

    function validateAndApplyUpdates(user, updates) {
      if (updates.name !== undefined) {
        if (!updates.name || updates.name.trim().length < 2) {
          throw new Error('Name must be at least 2 characters');
        }
        user.name = updates.name.trim();
      }

      if (updates.displayName !== undefined) user.displayName = updates.displayName?.trim() || null;
      if (updates.designation !== undefined) user.designation = updates.designation?.trim() || null;
      if (updates.bio !== undefined) user.bio = updates.bio?.trim() || null;
      if (updates.phone !== undefined) user.phone = updates.phone?.trim() || null;
      if (updates.showEmailPublicly !== undefined) user.showEmailPublicly = Boolean(updates.showEmailPublicly);
      if (updates.showPhonePublicly !== undefined) user.showPhonePublicly = Boolean(updates.showPhonePublicly);
      if (updates.isProfilePublic !== undefined) user.isProfilePublic = Boolean(updates.isProfilePublic);
      if (updates.avatarVisible !== undefined) user.avatarVisible = Boolean(updates.avatarVisible);

      if (updates.notificationPreferences) {
        user.notificationPreferences = {
          ...user.notificationPreferences,
          ...updates.notificationPreferences,
        };
      }

      return user;
    }

    test('updates personal information and designation', () => {
      const updated = validateAndApplyUpdates({ ...mockDbUser }, {
        displayName: 'Dr. Vance',
        designation: 'Professor of Political Science',
        bio: 'Researcher in digital governance.',
        phone: '+1-555-4321',
      });

      assert.equal(updated.displayName, 'Dr. Vance');
      assert.equal(updated.designation, 'Professor of Political Science');
      assert.equal(updated.bio, 'Researcher in digital governance.');
      assert.equal(updated.phone, '+1-555-4321');
    });

    test('toggles directory privacy and notification preferences', () => {
      const updated = validateAndApplyUpdates({ ...mockDbUser }, {
        showEmailPublicly: true,
        showPhonePublicly: true,
        notificationPreferences: { turnoutUpdates: true, emailInvites: false },
      });

      assert.equal(updated.showEmailPublicly, true);
      assert.equal(updated.showPhonePublicly, true);
      assert.equal(updated.notificationPreferences.turnoutUpdates, true);
      assert.equal(updated.notificationPreferences.emailInvites, false);
      assert.equal(updated.notificationPreferences.resultsPublished, true, 'Unchanged keys must be preserved');
    });

    test('rejects empty or invalid names', () => {
      assert.throws(() => validateAndApplyUpdates({ ...mockDbUser }, { name: ' ' }), /at least 2 characters/);
      assert.throws(() => validateAndApplyUpdates({ ...mockDbUser }, { name: 'A' }), /at least 2 characters/);
    });
  });

  // 3. User Organization Mapping & Role Assignment
  describe('3. Unified User Organizations Mapping', () => {
    test('aggregates owned and member organizations with accurate role permissions', () => {
      const userId = 'u-current';
      const ownedOrgs = [
        { id: 'org-1', name: 'Alpha Union', slug: 'alpha', ownerId: userId, type: 'university' },
      ];
      const memberships = [
        { orgId: 'org-2', role: 'admin', organization: { id: 'org-2', name: 'Beta Society', slug: 'beta', ownerId: 'other' } },
        { orgId: 'org-3', role: 'voter', organization: { id: 'org-3', name: 'Gamma Club', slug: 'gamma', ownerId: 'other' } },
      ];

      const allUserOrgsMap = new Map();
      for (const org of ownedOrgs) {
        allUserOrgsMap.set(org.id, {
          id: org.id,
          name: org.name,
          userRole: 'owner',
          isOwner: true,
        });
      }
      for (const m of memberships) {
        if (!allUserOrgsMap.has(m.orgId)) {
          allUserOrgsMap.set(m.orgId, {
            id: m.orgId,
            name: m.organization.name,
            userRole: m.role,
            isOwner: false,
          });
        }
      }

      const orgList = Array.from(allUserOrgsMap.values());
      assert.equal(orgList.length, 3);
      assert.equal(orgList.find((o) => o.id === 'org-1').userRole, 'owner');
      assert.equal(orgList.find((o) => o.id === 'org-2').userRole, 'admin');
      assert.equal(orgList.find((o) => o.id === 'org-3').userRole, 'voter');
    });
  });
});

