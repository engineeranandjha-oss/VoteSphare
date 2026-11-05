import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  memberInviteSchema,
  memberUpdateRoleSchema,
} from '../lib/validations/index.js';
import {
  ForbiddenError,
  UnauthorizedError,
} from '../lib/utils/error-handler.js';

// Authorization matrix mock test functions to verify business logic rules
function evaluateMockUserRole(org, member, userId) {
  if (!org || !userId) return null;
  if (org.ownerId === userId) return 'owner';
  if (member && member.userId === userId && member.status === 'active') {
    return member.role;
  }
  return null;
}

function evaluateCanManageElection(election, userRole, userId) {
  if (!userId || !election) return false;
  if (election.createdBy === userId) return true;
  return userRole === 'owner' || userRole === 'admin';
}

function assertOrgRole(userRole, userId, allowedRoles = ['owner', 'admin']) {
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new ForbiddenError('You do not have permission to perform this action in this organization');
  }
  return userRole;
}

describe('VoteSphere Module 14.7: Role-Based Access Control (RBAC) & Authorization Test Suite', () => {
  const orgId = '10000000-0000-4000-a000-000000000001';
  const ownerUserId = '90000000-0000-4000-a000-000000000001';
  const adminUserId = '90000000-0000-4000-a000-000000000002';
  const voterUserId = '90000000-0000-4000-a000-000000000003';
  const outsideUserId = '90000000-0000-4000-a000-000000000099';

  const mockOrg = { id: orgId, ownerId: ownerUserId };

  // =========================================================================
  // 1. Role Resolution Matrix
  // =========================================================================
  describe('1. Role Resolution & Hierarchy Matrix', () => {
    test('identifies organization owner correctly', () => {
      const role = evaluateMockUserRole(mockOrg, null, ownerUserId);
      assert.equal(role, 'owner');
    });

    test('identifies active administrator correctly', () => {
      const member = { userId: adminUserId, role: 'admin', status: 'active' };
      const role = evaluateMockUserRole(mockOrg, member, adminUserId);
      assert.equal(role, 'admin');
    });

    test('identifies active voter member correctly', () => {
      const member = { userId: voterUserId, role: 'voter', status: 'active' };
      const role = evaluateMockUserRole(mockOrg, member, voterUserId);
      assert.equal(role, 'voter');
    });

    test('returns null for non-active members (e.g. pending, suspended)', () => {
      const pendingMember = { userId: voterUserId, role: 'voter', status: 'pending' };
      assert.equal(evaluateMockUserRole(mockOrg, pendingMember, voterUserId), null);

      const suspendedMember = { userId: voterUserId, role: 'voter', status: 'suspended' };
      assert.equal(evaluateMockUserRole(mockOrg, suspendedMember, voterUserId), null);
    });

    test('returns null for outsiders without membership', () => {
      const role = evaluateMockUserRole(mockOrg, null, outsideUserId);
      assert.equal(role, null);
    });
  });

  // =========================================================================
  // 2. Election Management Authorization Checks
  // =========================================================================
  describe('2. Election Management Permissions', () => {
    const election = {
      id: '20000000-0000-4000-a000-000000000002',
      orgId,
      createdBy: adminUserId,
    };

    test('allows the original election creator to manage the election', () => {
      const allowed = evaluateCanManageElection(election, 'admin', adminUserId);
      assert.equal(allowed, true);
    });

    test('allows the organization owner to manage any election in the organization', () => {
      const allowed = evaluateCanManageElection(election, 'owner', ownerUserId);
      assert.equal(allowed, true);
    });

    test('allows organization admins to manage elections', () => {
      const otherAdminId = '90000000-0000-4000-a000-000000000004';
      const allowed = evaluateCanManageElection(election, 'admin', otherAdminId);
      assert.equal(allowed, true);
    });

    test('forbids voters and unauthenticated electors from managing elections', () => {
      assert.equal(evaluateCanManageElection(election, 'voter', voterUserId), false);
      assert.equal(evaluateCanManageElection(election, null, outsideUserId), false);
      assert.equal(evaluateCanManageElection(election, null, null), false);
    });
  });

  // =========================================================================
  // 3. Organization Role Assertion Guard (requireOrgRole)
  // =========================================================================
  describe('3. Route Guard & Exception Assertions', () => {
    test('passes for authorized roles', () => {
      assert.equal(assertOrgRole('owner', ownerUserId, ['owner', 'admin']), 'owner');
      assert.equal(assertOrgRole('admin', adminUserId, ['owner', 'admin']), 'admin');
    });

    test('throws UnauthorizedError (401) when user session is missing', () => {
      assert.throws(
        () => assertOrgRole('owner', null, ['owner']),
        (err) => err instanceof UnauthorizedError && err.statusCode === 401
      );
    });

    test('throws ForbiddenError (403) when user lacks required role privilege', () => {
      assert.throws(
        () => assertOrgRole('voter', voterUserId, ['owner', 'admin']),
        (err) => err instanceof ForbiddenError && err.statusCode === 403
      );
    });

    test('throws ForbiddenError (403) for non-members', () => {
      assert.throws(
        () => assertOrgRole(null, outsideUserId, ['owner', 'admin']),
        (err) => err instanceof ForbiddenError && err.statusCode === 403
      );
    });
  });

  // =========================================================================
  // 4. Role Mutation Schema Guardrails
  // =========================================================================
  describe('4. Role Assignment & Invitation Schema Validation', () => {
    test('validates member invitation roles and defaults to voter', () => {
      const parsedDefault = memberInviteSchema.parse({ email: 'new@univ.edu' });
      assert.equal(parsedDefault.role, 'voter');

      const parsedAdmin = memberInviteSchema.parse({ email: 'newadmin@univ.edu', role: 'admin' });
      assert.equal(parsedAdmin.role, 'admin');
    });

    test('rejects privilege escalation to unsupported or arbitrary roles', () => {
      const badRoles = ['superadmin', 'root', 'moderator', 'system', 'owner'];
      badRoles.forEach((badRole) => {
        assert.throws(() => {
          memberInviteSchema.parse({ email: 'user@univ.edu', role: badRole });
        });
      });
    });

    test('validates member role update schema for active transitions', () => {
      const updated = memberUpdateRoleSchema.parse({
        role: 'admin',
        status: 'active',
      });
      assert.equal(updated.role, 'admin');
      assert.equal(updated.status, 'active');
    });
  });

  // =========================================================================
  // 5. Billing Role-Based Access Control (TSK-MOD01-003)
  // =========================================================================
  describe('5. Billing Permissions Matrix', () => {
    function evaluateCanManageBilling(org, userId) {
      if (!org || !userId) return false;
      return org.ownerId === userId;
    }

    function evaluateCanViewBilling(org, member, userId) {
      if (!org || !userId) return false;
      if (org.ownerId === userId) return true;
      if (member && member.userId === userId && member.status === 'active') {
        return member.role === 'owner' || member.role === 'admin';
      }
      return false;
    }

    test('permits billing management exclusively to organization owner', () => {
      assert.equal(evaluateCanManageBilling(mockOrg, ownerUserId), true);
      assert.equal(evaluateCanManageBilling(mockOrg, adminUserId), false);
      assert.equal(evaluateCanManageBilling(mockOrg, voterUserId), false);
      assert.equal(evaluateCanManageBilling(mockOrg, outsideUserId), false);
    });

    test('permits viewing invoices and billing status to owners and admins', () => {
      const adminMember = { userId: adminUserId, role: 'admin', status: 'active' };
      const voterMember = { userId: voterUserId, role: 'voter', status: 'active' };

      assert.equal(evaluateCanViewBilling(mockOrg, null, ownerUserId), true);
      assert.equal(evaluateCanViewBilling(mockOrg, adminMember, adminUserId), true);
      assert.equal(evaluateCanViewBilling(mockOrg, voterMember, voterUserId), false);
      assert.equal(evaluateCanViewBilling(mockOrg, null, outsideUserId), false);
    });
  });
});
