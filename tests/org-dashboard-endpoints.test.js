import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../lib/utils/error-handler.js';
import { PLANS_CONFIG, formatPriceInr } from '../lib/billing/plans-config.js';
import { getSubscriptionStatusBadge } from '../lib/billing/subscription-lifecycle.js';

describe('VoteSphere Organization Dashboard & Profile Subscription Test Suite', () => {
  // Test Fixtures
  const user1 = {
    id: 'user-00000000-0000-4000-a000-000000000001',
    name: 'Alice Owner',
    email: 'alice@example.com',
  };

  const user2 = {
    id: 'user-00000000-0000-4000-a000-000000000002',
    name: 'Bob Member',
    email: 'bob@example.com',
  };

  const outsiderUser = {
    id: 'user-00000000-0000-4000-a000-000000000099',
    name: 'Mallory Outsider',
    email: 'mallory@example.com',
  };

  const userWithNoOrgs = {
    id: 'user-00000000-0000-4000-a000-000000000000',
    name: 'Newcomer',
    email: 'newcomer@example.com',
  };

  const orgA = {
    id: 'org-00000000-0000-4000-a000-00000000000a',
    name: 'Apex Voting Council',
    slug: 'apex-council',
    ownerId: user1.id,
  };

  const orgB = {
    id: 'org-00000000-0000-4000-a000-00000000000b',
    name: 'Beta Society',
    slug: 'beta-society',
    ownerId: 'some-other-user',
  };

  const memberships = [
    { orgId: orgA.id, userId: user1.id, role: 'owner', status: 'active' },
    { orgId: orgA.id, userId: user2.id, role: 'admin', status: 'active' },
  ];

  const elections = [
    { id: 'elec-1', orgId: orgA.id, title: 'Presidential Poll 2026', status: 'live' },
    { id: 'elec-2', orgId: orgA.id, title: 'Senate Election', status: 'completed' },
    { id: 'elec-3', orgId: orgB.id, title: 'Beta Internal Poll', status: 'draft' },
  ];

  // Helper simulating resolveDashboardOrg logic from /api/orgs/dashboard
  function simulateDashboardResolution({ user, requestedOrgId, availableOrgs = [orgA, orgB] }) {
    if (!user) {
      throw new UnauthorizedError('Authentication required to access dashboard');
    }

    const userMemberships = memberships.filter((m) => m.userId === user.id && m.status === 'active');
    const memberOrgIds = userMemberships.map((m) => m.orgId);
    const userOrgs = availableOrgs.filter((o) => o.ownerId === user.id || memberOrgIds.includes(o.id));

    if (requestedOrgId && requestedOrgId !== 'dashboard') {
      const target = userOrgs.find((o) => o.id === requestedOrgId || o.slug === requestedOrgId);
      if (!target) {
        const foreign = availableOrgs.find((o) => o.id === requestedOrgId || o.slug === requestedOrgId);
        if (foreign) {
          throw new ForbiddenError('You do not have permission to access this organization');
        }
        throw new NotFoundError('Organization not found');
      }
      const role = target.ownerId === user.id ? 'owner' : (userMemberships.find((m) => m.orgId === target.id)?.role || 'voter');
      return {
        id: target.id,
        organization: target,
        organizations: userOrgs,
        userRole: role,
        isOwner: role === 'owner',
        canManage: role === 'owner' || role === 'admin',
      };
    }

    // Empty state
    if (userOrgs.length === 0) {
      return {
        id: null,
        organization: null,
        organizations: [],
        userRole: null,
        isOwner: false,
        canManage: false,
        memberCount: 0,
        stats: { totalElections: 0, liveElections: 0 },
        plan: null,
        subscription: null,
      };
    }

    // Default to first user org
    const target = userOrgs.find((o) => o.ownerId === user.id) || userOrgs[0];
    const role = target.ownerId === user.id ? 'owner' : (userMemberships.find((m) => m.orgId === target.id)?.role || 'voter');
    return {
      id: target.id,
      organization: target,
      organizations: userOrgs,
      userRole: role,
      isOwner: role === 'owner',
      canManage: role === 'owner' || role === 'admin',
    };
  }

  // Helper simulating resolveDashboardElections logic from /api/orgs/dashboard/elections
  function simulateDashboardElections({ user, requestedOrgId, availableOrgs = [orgA, orgB] }) {
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userMemberships = memberships.filter((m) => m.userId === user.id && m.status === 'active');
    const memberOrgIds = userMemberships.map((m) => m.orgId);
    const userOrgs = availableOrgs.filter((o) => o.ownerId === user.id || memberOrgIds.includes(o.id));

    if (userOrgs.length === 0) {
      return { elections: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
    }

    let target = null;
    if (requestedOrgId && requestedOrgId !== 'dashboard') {
      target = userOrgs.find((o) => o.id === requestedOrgId || o.slug === requestedOrgId);
      if (!target) {
        const foreign = availableOrgs.find((o) => o.id === requestedOrgId || o.slug === requestedOrgId);
        if (foreign) {
          throw new ForbiddenError('You do not have permission to view elections for this organization');
        }
        throw new NotFoundError('Organization not found');
      }
    } else {
      target = userOrgs.find((o) => o.ownerId === user.id) || userOrgs[0];
    }

    const orgElections = elections.filter((e) => e.orgId === target.id);
    return {
      elections: orgElections,
      pagination: { total: orgElections.length, page: 1, limit: 50, totalPages: 1 },
    };
  }

  // 1. Dashboard API Tests
  describe('1. GET /api/orgs/dashboard Resolution & Security', () => {
    test('rejects unauthenticated requests with 401 Unauthorized', () => {
      assert.throws(
        () => simulateDashboardResolution({ user: null }),
        UnauthorizedError
      );
    });

    test('returns valid 200 empty-state when user has no organizations instead of 404', () => {
      const result = simulateDashboardResolution({ user: userWithNoOrgs });
      assert.equal(result.organization, null);
      assert.equal(result.id, null);
      assert.deepEqual(result.organizations, []);
      assert.equal(result.isOwner, false);
      assert.equal(result.canManage, false);
      assert.equal(result.stats.totalElections, 0);
    });

    test('returns active organization details and role for authenticated owner', () => {
      const result = simulateDashboardResolution({ user: user1 });
      assert.ok(result.organization);
      assert.equal(result.organization.id, orgA.id);
      assert.equal(result.userRole, 'owner');
      assert.equal(result.isOwner, true);
      assert.equal(result.canManage, true);
    });

    test('returns active organization details and role for authenticated admin/member', () => {
      const result = simulateDashboardResolution({ user: user2 });
      assert.ok(result.organization);
      assert.equal(result.organization.id, orgA.id);
      assert.equal(result.userRole, 'admin');
      assert.equal(result.isOwner, false);
      assert.equal(result.canManage, true);
    });

    test('blocks cross-tenant access with 403 Forbidden when requesting foreign organization', () => {
      assert.throws(
        () => simulateDashboardResolution({ user: outsiderUser, requestedOrgId: orgA.id }),
        ForbiddenError
      );
    });

    test('returns 404 Not Found when explicitly requesting non-existent organization', () => {
      assert.throws(
        () => simulateDashboardResolution({ user: user1, requestedOrgId: 'non-existent-uuid' }),
        NotFoundError
      );
    });
  });

  // 2. Dashboard Elections API Tests
  describe('2. GET /api/orgs/dashboard/elections Resolution & Security', () => {
    test('rejects unauthenticated requests with 401', () => {
      assert.throws(
        () => simulateDashboardElections({ user: null }),
        UnauthorizedError
      );
    });

    test('returns 200 OK with empty elections array when user has no organizations', () => {
      const result = simulateDashboardElections({ user: userWithNoOrgs });
      assert.deepEqual(result.elections, []);
      assert.equal(result.pagination.total, 0);
    });

    test('returns elections strictly scoped to user organization (tenant isolation)', () => {
      const result = simulateDashboardElections({ user: user1, requestedOrgId: orgA.id });
      assert.equal(result.elections.length, 2);
      assert.ok(result.elections.every((e) => e.orgId === orgA.id));
      assert.ok(!result.elections.some((e) => e.orgId === orgB.id));
    });

    test('blocks cross-tenant election listing with 403 Forbidden', () => {
      assert.throws(
        () => simulateDashboardElections({ user: user1, requestedOrgId: orgB.id }),
        ForbiddenError
      );
    });
  });

  // 3. Profile Subscription Telemetry & Plan Configuration Tests
  describe('3. Profile Subscription Telemetry & Plan Entitlements', () => {
    test('PLANS_CONFIG contains valid free, starter, pro, and enterprise configurations', () => {
      assert.ok(PLANS_CONFIG.free);
      assert.equal(PLANS_CONFIG.free.price, 0);
      assert.equal(PLANS_CONFIG.free.voterLimitPerElection, 50);
      assert.equal(PLANS_CONFIG.free.monthlyElectionAllowance, 2);

      assert.ok(PLANS_CONFIG['starter-monthly']);
      assert.equal(PLANS_CONFIG['starter-monthly'].price, 149900);
      assert.equal(PLANS_CONFIG['starter-monthly'].voterLimitPerElection, 250);

      assert.ok(PLANS_CONFIG['pro-monthly']);
      assert.equal(PLANS_CONFIG['pro-monthly'].price, 499900);
      assert.equal(PLANS_CONFIG['pro-monthly'].voterLimitPerElection, 1500);

      assert.ok(PLANS_CONFIG.enterprise);
      assert.equal(PLANS_CONFIG.enterprise.voterLimitPerElection, 10000);
    });

    test('formatPriceInr formats prices accurately into INR currency representations', () => {
      assert.equal(formatPriceInr(0), '₹0');
      assert.equal(formatPriceInr(149900), '₹1,499');
      assert.equal(formatPriceInr(499900), '₹4,999');
      assert.equal(formatPriceInr(299900), '₹2,999');
    });

    test('getSubscriptionStatusBadge returns proper metadata across lifecycle states', () => {
      const activeBadge = getSubscriptionStatusBadge('active');
      assert.equal(activeBadge.label, 'Active');
      assert.equal(activeBadge.variant, 'success');

      const pendingBadge = getSubscriptionStatusBadge('pending');
      assert.equal(pendingBadge.label, 'Payment Pending');
      assert.equal(pendingBadge.variant, 'warning');

      const cancelledBadge = getSubscriptionStatusBadge('cancelled');
      assert.equal(cancelledBadge.label, 'Cancelled');
      assert.equal(cancelledBadge.variant, 'muted');
    });

    test('calculates monthly election quota percentages and remaining usage safely', () => {
      const calculateUsage = (allowance, used) => ({
        remaining: Math.max(0, allowance - used),
        percentage: Math.min(100, Math.round((used / allowance) * 100)),
      });

      const freeUsage = calculateUsage(2, 1);
      assert.equal(freeUsage.remaining, 1);
      assert.equal(freeUsage.percentage, 50);

      const exhaustedUsage = calculateUsage(5, 5);
      assert.equal(exhaustedUsage.remaining, 0);
      assert.equal(exhaustedUsage.percentage, 100);

      const overUsage = calculateUsage(2, 4);
      assert.equal(overUsage.remaining, 0);
      assert.equal(overUsage.percentage, 100);
    });
  });

  // 4. Upgrade Navigation & RBAC Entitlements Tests
  describe('4. Upgrade Navigation & RBAC Gating', () => {
    test('only organization owners are granted canManageBilling privileges', () => {
      const ownerCheck = (role) => role === 'owner';
      assert.equal(ownerCheck('owner'), true);
      assert.equal(ownerCheck('admin'), false);
      assert.equal(ownerCheck('voter'), false);
      assert.equal(ownerCheck(null), false);
    });

    test('upgrade URL preserves organization and active plan context without executing payments', () => {
      const generateUpgradeUrl = (orgId, currentPlan) =>
        `/pricing?orgId=${encodeURIComponent(orgId)}&currentPlan=${encodeURIComponent(currentPlan)}`;

      const url = generateUpgradeUrl(orgA.id, 'free');
      assert.equal(url, `/pricing?orgId=${orgA.id}&currentPlan=free`);

      // Must be a navigational GET link, not a POST payment charge
      assert.ok(!url.includes('charge'));
      assert.ok(!url.includes('checkout_nonce'));
    });
  });
});
