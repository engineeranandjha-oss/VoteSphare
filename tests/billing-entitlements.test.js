import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getEffectiveVoterCapacity,
  assertCanCreateElection,
  assertCanEnrollVoters,
  assertCanLaunchElection,
  assertCanRunoff,
  hasFeature,
  canUseCustomBranding,
  recordUsage,
  getEffectiveOrgSubscription,
} from '../lib/billing/entitlements.js';

import {
  OrganizationSubscription,
  SubscriptionPlan,
  Election,
  Eligibility,
  UsageRecord,
} from '../models/index.js';

import { PLANS_CONFIG } from '../lib/billing/plans-config.js';
import { PaymentRequiredError } from '../lib/utils/error-handler.js';

describe('VoteSphere Module 16.3: Subscription Entitlement Engine Test Suite', () => {

  // Save original methods so we can restore them
  const originalMethods = {};

  beforeEach(() => {
    originalMethods.subFindOne = OrganizationSubscription.findOne;
    originalMethods.planFindOne = SubscriptionPlan.findOne;
    originalMethods.electionCount = Election.count;
    originalMethods.electionFindByPk = Election.findByPk;
    originalMethods.eligibilityCount = Eligibility.count;
    originalMethods.usageCreate = UsageRecord.create;
  });

  afterEach(() => {
    OrganizationSubscription.findOne = originalMethods.subFindOne;
    SubscriptionPlan.findOne = originalMethods.planFindOne;
    Election.count = originalMethods.electionCount;
    Election.findByPk = originalMethods.electionFindByPk;
    Eligibility.count = originalMethods.eligibilityCount;
    UsageRecord.create = originalMethods.usageCreate;
  });

  // =========================================================================
  // 1. Voter Capacity Calculations
  // =========================================================================
  describe('1. Voter Capacity Computation (getEffectiveVoterCapacity)', () => {
    test('computes capacity based on base plan voter limit', () => {
      const freeCapacity = getEffectiveVoterCapacity(PLANS_CONFIG.free);
      assert.equal(freeCapacity, 50);

      const starterCapacity = getEffectiveVoterCapacity(PLANS_CONFIG['starter-monthly']);
      assert.equal(starterCapacity, 250);

      const proCapacity = getEffectiveVoterCapacity(PLANS_CONFIG['pro-monthly']);
      assert.equal(proCapacity, 1500);

      const eventPassCapacity = getEffectiveVoterCapacity(PLANS_CONFIG['event-pass']);
      assert.equal(eventPassCapacity, 500);
    });

    test('adds booster pack capacity from election.config.additionalVoters', () => {
      const electionWithBooster = {
        config: {
          additionalVoters: 250,
        },
      };

      const totalCapacity = getEffectiveVoterCapacity(PLANS_CONFIG.free, electionWithBooster);
      assert.equal(totalCapacity, 300, '50 base + 250 booster should equal 300');
    });

    test('gracefully handles missing plan or election config', () => {
      assert.equal(getEffectiveVoterCapacity(null), 50, 'Null plan defaults to 50');
      assert.equal(getEffectiveVoterCapacity({}, null), 50, 'Empty plan defaults to 50');
    });
  });

  // =========================================================================
  // 2. Automated Runoff Feature Gating
  // =========================================================================
  describe('2. Runoff Entitlement Gating (assertCanRunoff)', () => {
    test('rejects Free tier from creating runoff elections with HTTP 402', async () => {
      OrganizationSubscription.findOne = async () => null;
      SubscriptionPlan.findOne = async () => PLANS_CONFIG.free;

      await assert.rejects(
        async () => {
          await assertCanRunoff('org-free-id');
        },
        (err) => {
          assert.ok(err instanceof PaymentRequiredError, 'Should throw PaymentRequiredError');
          assert.equal(err.statusCode, 402);
          assert.equal(err.details.feature, 'runoff');
          return true;
        }
      );
    });

    test('rejects Starter tier from creating runoff elections', async () => {
      OrganizationSubscription.findOne = async () => ({
        status: 'active',
        plan: PLANS_CONFIG['starter-monthly'],
      });

      await assert.rejects(
        async () => {
          await assertCanRunoff('org-starter-id');
        },
        (err) => {
          assert.ok(err instanceof PaymentRequiredError);
          assert.equal(err.statusCode, 402);
          return true;
        }
      );
    });

    test('allows Pro, Enterprise, and Event Pass tiers to create runoffs', async () => {
      OrganizationSubscription.findOne = async () => ({
        status: 'active',
        plan: PLANS_CONFIG['pro-monthly'],
      });

      const result = await assertCanRunoff('org-pro-id');
      assert.deepEqual(result, { allowed: true });
    });
  });

  // =========================================================================
  // 3. Monthly Election Creation Limits
  // =========================================================================
  describe('3. Monthly Election Creation Limits (assertCanCreateElection)', () => {
    test('permits election creation when within monthly allowance', async () => {
      OrganizationSubscription.findOne = async () => null; // Free plan (allowance: 2)
      SubscriptionPlan.findOne = async () => PLANS_CONFIG.free;
      Election.count = async () => 1; // 1 created this month

      const result = await assertCanCreateElection('org-free-id');
      assert.equal(result.allowed, true);
      assert.equal(result.currentCount, 1);
      assert.equal(result.limit, 2);
    });

    test('throws PaymentRequiredError when monthly limit is reached', async () => {
      OrganizationSubscription.findOne = async () => null; // Free plan (allowance: 2)
      SubscriptionPlan.findOne = async () => PLANS_CONFIG.free;
      Election.count = async () => 2; // already created 2

      await assert.rejects(
        async () => {
          await assertCanCreateElection('org-free-id');
        },
        (err) => {
          assert.ok(err instanceof PaymentRequiredError);
          assert.equal(err.statusCode, 402);
          assert.equal(err.details.limit, 2);
          assert.equal(err.details.current, 2);
          assert.equal(err.details.resource, 'monthly_elections');
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 4. Voter Enrollment Capacity Enforcement
  // =========================================================================
  describe('4. Voter Enrollment Limits (assertCanEnrollVoters)', () => {
    test('permits voter enrollment when total is within capacity', async () => {
      OrganizationSubscription.findOne = async () => null; // Free plan (limit: 50)
      SubscriptionPlan.findOne = async () => PLANS_CONFIG.free;
      Election.findByPk = async () => ({ id: 'elec-1', config: {} });
      Eligibility.count = async () => 30; // 30 enrolled

      const result = await assertCanEnrollVoters('org-free-id', 'elec-1', 15);
      assert.equal(result.allowed, true);
      assert.equal(result.currentCount, 30);
      assert.equal(result.effectiveLimit, 50);
    });

    test('blocks enrollment with 402 and suggests appropriate booster when exceeding limit', async () => {
      OrganizationSubscription.findOne = async () => null; // Free plan (limit: 50)
      SubscriptionPlan.findOne = async () => PLANS_CONFIG.free;
      Election.findByPk = async () => ({ id: 'elec-1', config: {} });
      Eligibility.count = async () => 40; // 40 enrolled

      // Attempt to enroll 20 more (40 + 20 = 60, excess = 10)
      await assert.rejects(
        async () => {
          await assertCanEnrollVoters('org-free-id', 'elec-1', 20);
        },
        (err) => {
          assert.ok(err instanceof PaymentRequiredError);
          assert.equal(err.statusCode, 402);
          assert.equal(err.details.limit, 50);
          assert.equal(err.details.current, 40);
          assert.equal(err.details.attempted, 20);
          assert.equal(err.details.suggestedBooster, 'booster-250');
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 5. Concurrent Live Election Quotas
  // =========================================================================
  describe('5. Concurrent Live Election Quotas (assertCanLaunchElection)', () => {
    test('permits launch when live elections count is below plan allowance', async () => {
      OrganizationSubscription.findOne = async () => ({
        status: 'active',
        plan: PLANS_CONFIG['starter-monthly'], // simultaneous: 3
      });
      Election.count = async () => 1; // 1 currently live
      Election.findByPk = async () => ({ id: 'elec-2', config: {} });
      Eligibility.count = async () => 100; // 100 enrolled (< 250)

      const result = await assertCanLaunchElection('org-starter-id', 'elec-2');
      assert.equal(result.allowed, true);
    });

    test('blocks launch when concurrent live allowance is reached', async () => {
      OrganizationSubscription.findOne = async () => null; // Free plan (simultaneous: 1)
      SubscriptionPlan.findOne = async () => PLANS_CONFIG.free;
      Election.count = async () => 1; // 1 already live!

      await assert.rejects(
        async () => {
          await assertCanLaunchElection('org-free-id', 'elec-2');
        },
        (err) => {
          assert.ok(err instanceof PaymentRequiredError);
          assert.equal(err.statusCode, 402);
          assert.equal(err.details.resource, 'simultaneous_live');
          assert.equal(err.details.limit, 1);
          return true;
        }
      );
    });

    test('blocks launch if election voter count exceeds plan capacity', async () => {
      OrganizationSubscription.findOne = async () => null; // Free plan (limit: 50)
      SubscriptionPlan.findOne = async () => PLANS_CONFIG.free;
      Election.count = async () => 0; // 0 live
      Election.findByPk = async () => ({ id: 'elec-big', config: {} });
      Eligibility.count = async () => 80; // 80 voters on 50 limit!

      await assert.rejects(
        async () => {
          await assertCanLaunchElection('org-free-id', 'elec-big');
        },
        (err) => {
          assert.ok(err instanceof PaymentRequiredError);
          assert.equal(err.statusCode, 402);
          assert.equal(err.details.resource, 'voters');
          assert.equal(err.details.current, 80);
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 6. Custom Branding & Feature Checks
  // =========================================================================
  describe('6. Feature Flags & Custom Branding (hasFeature, canUseCustomBranding)', () => {
    test('correctly identifies custom branding availability across tiers', async () => {
      // Free plan: false
      OrganizationSubscription.findOne = async () => null;
      SubscriptionPlan.findOne = async () => PLANS_CONFIG.free;
      assert.equal(await canUseCustomBranding('org-free'), false);

      // Starter plan: false
      OrganizationSubscription.findOne = async () => ({
        status: 'active',
        plan: PLANS_CONFIG['starter-monthly'],
      });
      assert.equal(await canUseCustomBranding('org-starter'), false);

      // Pro plan: true
      OrganizationSubscription.findOne = async () => ({
        status: 'active',
        plan: PLANS_CONFIG['pro-monthly'],
      });
      assert.equal(await canUseCustomBranding('org-pro'), true);

      // Enterprise plan: true
      OrganizationSubscription.findOne = async () => ({
        status: 'active',
        plan: PLANS_CONFIG.enterprise,
      });
      assert.equal(await canUseCustomBranding('org-ent'), true);
    });

    test('checks arbitrary feature flags via hasFeature', async () => {
      OrganizationSubscription.findOne = async () => ({
        status: 'active',
        plan: PLANS_CONFIG['starter-monthly'],
      });

      assert.equal(await hasFeature('org-1', 'bulkEmail'), true);
      assert.equal(await hasFeature('org-1', 'runoff'), false);
      assert.equal(await hasFeature('org-1', 'nonExistentFeature'), false);
    });
  });

  // =========================================================================
  // 7. Telemetry & Usage Records (recordUsage)
  // =========================================================================
  describe('7. Quota Telemetry (recordUsage)', () => {
    test('persists usage record with formatted billingPeriodMonth', async () => {
      let createdData = null;
      UsageRecord.create = async (data) => {
        createdData = data;
        return data;
      };

      await recordUsage({
        orgId: 'org-test-uuid',
        usageType: 'voter_enrolled',
        quantity: 45,
        electionId: 'elec-test-uuid',
      });

      assert.ok(createdData, 'Record should have been created');
      assert.equal(createdData.orgId, 'org-test-uuid');
      assert.equal(createdData.usageType, 'voter_enrolled');
      assert.equal(createdData.quantity, 45);
      assert.equal(createdData.electionId, 'elec-test-uuid');
      assert.match(createdData.billingPeriodMonth, /^\d{4}-\d{2}$/, 'billingPeriodMonth should match YYYY-MM');
    });

    test('silently suppresses DB errors during usage telemetry write', async () => {
      UsageRecord.create = async () => {
        throw new Error('Database connection failed');
      };

      // Must NOT throw
      await assert.doesNotReject(async () => {
        await recordUsage({
          orgId: 'org-test-uuid',
          usageType: 'election_created',
        });
      });
    });
  });

  // =========================================================================
  // 8. Grace Period and Fallback (getEffectiveOrgSubscription)
  // =========================================================================
  describe('8. Grace Period and Operational Status', () => {
    test('recognizes active subscription', async () => {
      const mockSub = {
        status: 'active',
        plan: PLANS_CONFIG['pro-monthly'],
      };
      OrganizationSubscription.findOne = async () => mockSub;

      const result = await getEffectiveOrgSubscription('org-1');
      assert.equal(result.plan.slug, 'pro-monthly');
      assert.equal(result.isGracePeriod, false);
      assert.ok(result.subscription);
    });

    test('honors active grace period for pending subscription', async () => {
      const futureGraceEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days in future
      const mockSub = {
        status: 'pending',
        gracePeriodEnd: futureGraceEnd,
        plan: PLANS_CONFIG['pro-monthly'],
      };
      OrganizationSubscription.findOne = async () => mockSub;

      const result = await getEffectiveOrgSubscription('org-grace');
      assert.equal(result.plan.slug, 'pro-monthly');
      assert.equal(result.isGracePeriod, true);
      assert.equal(result.gracePeriodEnd, futureGraceEnd);
    });

    test('falls back to Free tier when grace period has expired', async () => {
      const expiredGraceEnd = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day in past
      const mockSub = {
        status: 'pending',
        gracePeriodEnd: expiredGraceEnd,
        plan: PLANS_CONFIG['pro-monthly'],
      };
      OrganizationSubscription.findOne = async () => mockSub;
      SubscriptionPlan.findOne = async () => PLANS_CONFIG.free;

      const result = await getEffectiveOrgSubscription('org-expired');
      assert.equal(result.plan.slug, 'free');
      assert.equal(result.subscription, null);
      assert.equal(result.isGracePeriod, false);
    });
  });
});
