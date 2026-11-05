import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ForbiddenError,
  NotFoundError,
} from '../lib/utils/error-handler.js';
import {
  getOrgScopedElectionUrl,
  getOrgScopedResultsUrl,
} from '../lib/sharing/links.js';

// Multi-tenant isolation simulation engine
function verifyTenantElectionAccess({ userOrgMemberships, election, requestedAction = 'view' }) {
  if (!election) {
    throw new NotFoundError('Election not found');
  }

  const membership = userOrgMemberships.find((m) => m.orgId === election.orgId);

  // If public view action on live or published election, permitted
  if (requestedAction === 'view_public' && (election.status === 'live' || election.status === 'published' || election.status === 'ended')) {
    return { permitted: true, role: membership?.role || 'public' };
  }

  // Draft or private access requires admin/owner role in the election's organization
  if (election.status === 'draft' || requestedAction === 'admin_manage' || requestedAction === 'roster_manage') {
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new ForbiddenError('Tenant isolation: Access denied to foreign organization election');
    }
    return { permitted: true, role: membership.role };
  }

  // Voting action requires active eligibility for this election
  if (requestedAction === 'vote') {
    if (!membership || membership.status !== 'active') {
      throw new ForbiddenError('Tenant isolation: Not a member of the organizing tenant');
    }
    return { permitted: true, role: membership.role };
  }

  return { permitted: true, role: membership?.role || 'public' };
}

describe('VoteSphere Module 14.8: Multi-Tenant Organization Isolation Test Suite', () => {
  // Tenant A Fixtures
  const tenantA = {
    id: '10000000-0000-4000-a000-00000000000a',
    name: 'Alpha Engineering Society',
    slug: 'alpha-eng',
  };
  const electionA_Draft = {
    id: '20000000-0000-4000-a000-00000000000a',
    orgId: tenantA.id,
    title: 'Alpha Internal Election (Draft)',
    status: 'draft',
  };
  const electionA_Live = {
    id: '20000000-0000-4000-a000-00000000001a',
    orgId: tenantA.id,
    title: 'Alpha Presidential Race 2026',
    status: 'live',
  };

  // Tenant B Fixtures
  const tenantB = {
    id: '10000000-0000-4000-a000-00000000000b',
    name: 'Beta Medical Association',
    slug: 'beta-med',
  };
  const electionB_Draft = {
    id: '20000000-0000-4000-a000-00000000000b',
    orgId: tenantB.id,
    title: 'Beta Board Election (Draft)',
    status: 'draft',
  };

  // User Personas
  const adminTenantA = [
    { orgId: tenantA.id, role: 'admin', status: 'active' },
  ];
  const adminTenantB = [
    { orgId: tenantB.id, role: 'admin', status: 'active' },
  ];
  const voterTenantA = [
    { orgId: tenantA.id, role: 'voter', status: 'active' },
  ];
  const outsiderUser = [];

  // =========================================================================
  // 1. Cross-Tenant Administrative Isolation
  // =========================================================================
  describe('1. Cross-Tenant Administrative Boundary Enforcement', () => {
    test('allows Tenant A admin to manage Tenant A draft elections', () => {
      const access = verifyTenantElectionAccess({
        userOrgMemberships: adminTenantA,
        election: electionA_Draft,
        requestedAction: 'admin_manage',
      });
      assert.equal(access.permitted, true);
      assert.equal(access.role, 'admin');
    });

    test('STRICTLY BLOCKS Tenant A admin from managing Tenant B draft elections', () => {
      assert.throws(
        () => {
          verifyTenantElectionAccess({
            userOrgMemberships: adminTenantA,
            election: electionB_Draft,
            requestedAction: 'admin_manage',
          });
        },
        (err) => err instanceof ForbiddenError && err.statusCode === 403
      );
    });

    test('STRICTLY BLOCKS Tenant B admin from managing Tenant A voter roster', () => {
      assert.throws(
        () => {
          verifyTenantElectionAccess({
            userOrgMemberships: adminTenantB,
            election: electionA_Live,
            requestedAction: 'roster_manage',
          });
        },
        (err) => err instanceof ForbiddenError && err.statusCode === 403
      );
    });
  });

  // =========================================================================
  // 2. Draft Election Data Partitioning & Leak Prevention
  // =========================================================================
  describe('2. Draft Election & Private Resource Partitioning', () => {
    test('forbids unauthenticated outsiders from viewing draft elections of any tenant', () => {
      assert.throws(
        () => {
          verifyTenantElectionAccess({
            userOrgMemberships: outsiderUser,
            election: electionA_Draft,
            requestedAction: 'view',
          });
        },
        (err) => err instanceof ForbiddenError && err.statusCode === 403
      );
    });

    test('forbids regular voters in Tenant A from accessing admin draft management', () => {
      assert.throws(
        () => {
          verifyTenantElectionAccess({
            userOrgMemberships: voterTenantA,
            election: electionA_Draft,
            requestedAction: 'admin_manage',
          });
        },
        (err) => err instanceof ForbiddenError && err.statusCode === 403
      );
    });
  });

  // =========================================================================
  // 3. Multi-Tenant URL & Routing Partitioning
  // =========================================================================
  describe('3. Multi-Tenant Vanity URLs & Slugs Partitioning', () => {
    test('generates strictly segregated vanity election URLs per organization slug', () => {
      const urlA = getOrgScopedElectionUrl(tenantA.slug, electionA_Live.id, 'https://votesphere.app');
      const urlB = getOrgScopedElectionUrl(tenantB.slug, electionB_Draft.id, 'https://votesphere.app');

      assert.equal(urlA, `https://votesphere.app/org/${tenantA.slug}/e/${electionA_Live.id}`);
      assert.equal(urlB, `https://votesphere.app/org/${tenantB.slug}/e/${electionB_Draft.id}`);
      assert.ok(!urlA.includes(tenantB.slug));
      assert.ok(!urlB.includes(tenantA.slug));
    });

    test('generates strictly segregated results URLs per organization slug', () => {
      const resA = getOrgScopedResultsUrl(tenantA.slug, electionA_Live.id, 'https://votesphere.app');
      assert.equal(resA, `https://votesphere.app/org/${tenantA.slug}/e/${electionA_Live.id}/results`);
    });
  });
});
