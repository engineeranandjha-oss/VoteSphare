import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  PLANS_CONFIG,
  VOTER_BOOSTER_PACKS,
  getPlanBySlug,
  getBoosterPackBySlug,
  getAllActivePlans,
  formatPriceInr,
} from '../lib/billing/plans-config.js';

import {
  SUBSCRIPTION_STATUSES,
  ALLOWED_SUBSCRIPTION_TRANSITIONS,
  canTransitionSubscription,
  isSubscriptionOperational,
  computeGracePeriodEnd,
  getSubscriptionStatusBadge,
  GRACE_PERIOD_DAYS,
} from '../lib/billing/subscription-lifecycle.js';

import {
  gstinSchema,
  subscriptionCreateSchema,
  orderCreateSchema,
  subscriptionVerifySchema,
  orderVerifySchema,
  subscriptionCancelSchema,
} from '../lib/validations/index.js';

import {
  PaymentRequiredError,
  AppError,
} from '../lib/utils/error-handler.js';

describe('VoteSphere Module 16.1: Pricing Configuration & Subscription Foundation Test Suite', () => {

  // =========================================================================
  // 1. TSK-MOD01-001: Static Plan Specifications & Constants Tests
  // =========================================================================
  describe('1. Static Plan Specifications & Formatting', () => {
    test('defines all required canonical tiers with frozen immutability', () => {
      assert.ok(PLANS_CONFIG.free, 'Free tier must be defined');
      assert.ok(PLANS_CONFIG['event-pass'], 'Event Pass tier must be defined');
      assert.ok(PLANS_CONFIG['starter-monthly'], 'Starter Monthly tier must be defined');
      assert.ok(PLANS_CONFIG['starter-annual'], 'Starter Annual tier must be defined');
      assert.ok(PLANS_CONFIG['pro-monthly'], 'Pro Monthly tier must be defined');
      assert.ok(PLANS_CONFIG['pro-annual'], 'Pro Annual tier must be defined');
      assert.ok(PLANS_CONFIG.enterprise, 'Enterprise tier must be defined');

      assert.ok(Object.isFrozen(PLANS_CONFIG), 'PLANS_CONFIG must be deeply frozen');
      assert.ok(Object.isFrozen(PLANS_CONFIG.free.features), 'Plan features must be frozen');
    });

    test('verifies correct pricing units in paise and allowances', () => {
      assert.equal(PLANS_CONFIG.free.price, 0);
      assert.equal(PLANS_CONFIG.free.voterLimitPerElection, 50);
      assert.equal(PLANS_CONFIG.free.monthlyElectionAllowance, 2);

      assert.equal(PLANS_CONFIG['event-pass'].price, 299900); // ₹2,999
      assert.equal(PLANS_CONFIG['event-pass'].voterLimitPerElection, 500);

      assert.equal(PLANS_CONFIG['starter-monthly'].price, 149900); // ₹1,499
      assert.equal(PLANS_CONFIG['starter-monthly'].voterLimitPerElection, 250);

      assert.equal(PLANS_CONFIG['pro-monthly'].price, 499900); // ₹4,999
      assert.equal(PLANS_CONFIG['pro-monthly'].voterLimitPerElection, 1500);
      assert.equal(PLANS_CONFIG['pro-monthly'].features.runoff, true);
      assert.equal(PLANS_CONFIG['pro-monthly'].features.customBranding, true);
    });

    test('retrieves plan by slug safely with fallback to Free tier', () => {
      assert.equal(getPlanBySlug('pro-monthly').slug, 'pro-monthly');
      assert.equal(getPlanBySlug('PRO-MONTHLY').slug, 'pro-monthly'); // Case-insensitive
      assert.equal(getPlanBySlug('unknown-slug').slug, 'free');
      assert.equal(getPlanBySlug(null).slug, 'free');
    });

    test('verifies voter capacity booster packs', () => {
      assert.equal(VOTER_BOOSTER_PACKS['booster-250'].additionalVoters, 250);
      assert.equal(VOTER_BOOSTER_PACKS['booster-250'].price, 79900);

      assert.equal(VOTER_BOOSTER_PACKS['booster-500'].additionalVoters, 500);
      assert.equal(VOTER_BOOSTER_PACKS['booster-500'].price, 129900);

      assert.equal(VOTER_BOOSTER_PACKS['booster-1500'].additionalVoters, 1500);
      assert.equal(VOTER_BOOSTER_PACKS['booster-1500'].price, 299900);

      assert.equal(getBoosterPackBySlug('booster-500').additionalVoters, 500);
      assert.equal(getBoosterPackBySlug('invalid'), null);
    });

    test('returns all active plans in ascending sort order', () => {
      const activePlans = getAllActivePlans();
      assert.equal(activePlans.length, 7);
      for (let i = 0; i < activePlans.length - 1; i++) {
        assert.ok(activePlans[i].sortOrder <= activePlans[i + 1].sortOrder);
      }
    });

    test('formats price in paise into formatted Indian Rupee string', () => {
      const formattedFree = formatPriceInr(0);
      assert.ok(formattedFree.includes('0'));

      const formattedPro = formatPriceInr(499900);
      assert.ok(formattedPro.includes('4,999'));

      const formattedBooster = formatPriceInr(79900);
      assert.ok(formattedBooster.includes('799'));
    });
  });

  // =========================================================================
  // 2. TSK-MOD01-002: Subscription Lifecycle States & Transitions
  // =========================================================================
  describe('2. Subscription Lifecycle State Machine', () => {
    test('permits valid state transitions according to state machine', () => {
      assert.equal(canTransitionSubscription('active', 'active'), true);
      assert.equal(canTransitionSubscription('active', 'pending'), true);
      assert.equal(canTransitionSubscription('active', 'cancelled'), true);
      assert.equal(canTransitionSubscription('active', 'halted'), true);

      assert.equal(canTransitionSubscription('pending', 'active'), true);
      assert.equal(canTransitionSubscription('pending', 'halted'), true);

      assert.equal(canTransitionSubscription('halted', 'active'), true);
      assert.equal(canTransitionSubscription('trialing', 'active'), true);
      assert.equal(canTransitionSubscription('cancelled', 'active'), true);
    });

    test('rejects illegal subscription state transitions', () => {
      // Halted cannot jump directly to trialing or pending
      assert.equal(canTransitionSubscription('halted', 'trialing'), false);
      assert.equal(canTransitionSubscription('halted', 'pending'), false);

      // Completed cannot jump to pending
      assert.equal(canTransitionSubscription('completed', 'pending'), false);

      // Expired cannot jump to pending or trialing
      assert.equal(canTransitionSubscription('expired', 'trialing'), false);
      assert.equal(canTransitionSubscription('expired', 'pending'), false);

      // Null or empty inputs return false
      assert.equal(canTransitionSubscription(null, 'active'), false);
      assert.equal(canTransitionSubscription('active', null), false);
    });

    test('evaluates operational status correctly during active, trial, and grace period', () => {
      // Active and Trialing are always operational
      assert.equal(isSubscriptionOperational('active'), true);
      assert.equal(isSubscriptionOperational('trialing'), true);

      // Halted, Cancelled, Expired are not operational
      assert.equal(isSubscriptionOperational('halted'), false);
      assert.equal(isSubscriptionOperational('expired'), false);

      // Pending within grace period is operational
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      assert.equal(isSubscriptionOperational('pending', futureDate), true);

      // Pending with expired grace period is NOT operational
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      assert.equal(isSubscriptionOperational('pending', pastDate), false);
    });

    test('computes standard 7-day grace period correctly', () => {
      const now = new Date('2026-11-01T12:00:00Z');
      const graceEnd = computeGracePeriodEnd(now, GRACE_PERIOD_DAYS);
      const expectedEnd = new Date('2026-11-08T12:00:00Z');
      assert.equal(graceEnd.toISOString(), expectedEnd.toISOString());
    });

    test('provides UI status badge metadata', () => {
      const activeBadge = getSubscriptionStatusBadge('active');
      assert.equal(activeBadge.label, 'Active');
      assert.equal(activeBadge.variant, 'success');

      const pendingBadge = getSubscriptionStatusBadge('pending');
      assert.equal(pendingBadge.label, 'Payment Pending');
      assert.equal(pendingBadge.variant, 'warning');

      const haltedBadge = getSubscriptionStatusBadge('halted');
      assert.equal(haltedBadge.label, 'Halted');
      assert.equal(haltedBadge.variant, 'destructive');
    });
  });

  // =========================================================================
  // 3. TSK-MOD01-004: Payment & Billing Validation Schemas
  // =========================================================================
  describe('3. Payment & Billing Zod Schemas', () => {
    test('validates valid Indian GSTIN format', () => {
      const validGstin = '29AAAAA0000A1Z5';
      assert.equal(gstinSchema.parse(validGstin), '29AAAAA0000A1Z5');

      // Empty or null is acceptable (optional field)
      assert.equal(gstinSchema.parse(''), '');
      assert.equal(gstinSchema.parse(null), null);
    });

    test('rejects malformed Indian GSTIN', () => {
      assert.throws(() => gstinSchema.parse('INVALID123'), /Invalid Indian GSTIN format/);
      assert.throws(() => gstinSchema.parse('29AAAAA0000A1Z'), /Invalid Indian GSTIN format/); // 14 chars
      assert.throws(() => gstinSchema.parse('29AAAAA0000A1Z59'), /Invalid Indian GSTIN format/); // 16 chars
    });

    test('validates subscriptionCreateSchema', () => {
      const validPayload = {
        orgId: '10000000-0000-4000-a000-000000000001',
        planSlug: 'pro-monthly',
        customerGstin: '29AAAAA0000A1Z5',
        billingName: 'Acme University Inc.',
        billingAddress: '123 Campus Road, Bengaluru',
      };
      const parsed = subscriptionCreateSchema.parse(validPayload);
      assert.equal(parsed.planSlug, 'pro-monthly');
      assert.equal(parsed.customerGstin, '29AAAAA0000A1Z5');
    });

    test('rejects subscriptionCreateSchema with invalid plan slug', () => {
      const invalidPayload = {
        orgId: '10000000-0000-4000-a000-000000000001',
        planSlug: 'super-deluxe-unlimited', // Not in allowed enum
      };
      assert.throws(() => subscriptionCreateSchema.parse(invalidPayload));
    });

    test('validates orderCreateSchema for Event Pass and Voter Booster', () => {
      const eventPassPayload = {
        orgId: '10000000-0000-4000-a000-000000000001',
        orderType: 'event_pass',
      };
      assert.doesNotThrow(() => orderCreateSchema.parse(eventPassPayload));

      const boosterPayload = {
        orgId: '10000000-0000-4000-a000-000000000001',
        orderType: 'voter_booster',
        boosterSlug: 'booster-500',
        electionId: '20000000-0000-4000-a000-000000000002',
      };
      assert.doesNotThrow(() => orderCreateSchema.parse(boosterPayload));

      // voter_booster without boosterSlug must fail refinement
      const missingBoosterSlug = {
        orgId: '10000000-0000-4000-a000-000000000001',
        orderType: 'voter_booster',
      };
      assert.throws(() => orderCreateSchema.parse(missingBoosterSlug), /boosterSlug is required/);
    });

    test('validates signature verification schemas', () => {
      const subVerifyPayload = {
        razorpay_payment_id: 'pay_test123',
        razorpay_subscription_id: 'sub_test456',
        razorpay_signature: 'abc123sig',
      };
      assert.doesNotThrow(() => subscriptionVerifySchema.parse(subVerifyPayload));

      const orderVerifyPayload = {
        razorpay_order_id: 'order_test789',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'abc123sig',
      };
      assert.doesNotThrow(() => orderVerifySchema.parse(orderVerifyPayload));
    });
  });

  // =========================================================================
  // 4. TSK-MOD01-005: PaymentRequiredError (HTTP 402)
  // =========================================================================
  describe('4. PaymentRequiredError (HTTP 402)', () => {
    test('instantiates PaymentRequiredError with status code 402 and structured metadata', () => {
      const metadata = {
        limit: 50,
        current: 50,
        attempted: 1,
        upgradePlan: 'starter-monthly',
      };
      const err = new PaymentRequiredError('Voter limit reached on Free plan', metadata);

      assert.ok(err instanceof AppError, 'Must extend AppError');
      assert.ok(err instanceof Error, 'Must extend Error');
      assert.equal(err.name, 'PaymentRequiredError');
      assert.equal(err.statusCode, 402);
      assert.equal(err.message, 'Voter limit reached on Free plan');
      assert.deepEqual(err.details, metadata);
    });
  });
});

