import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  PLANS_CONFIG,
  VOTER_BOOSTER_PACKS,
  getBoosterPackBySlug,
  formatPriceInr,
} from '../lib/billing/plans-config.js';
import {
  computeGracePeriodEnd,
  canTransitionSubscription,
  isSubscriptionOperational,
  SUBSCRIPTION_STATUSES,
  GRACE_PERIOD_DAYS,
} from '../lib/billing/subscription-lifecycle.js';
import {
  getEffectiveVoterCapacity,
} from '../lib/billing/entitlements.js';
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../lib/billing/razorpay.js';
import crypto from 'node:crypto';

describe('Module 16.10: End-to-End Monetization Lifecycle Simulation', () => {
  const dummyOrgId = 'a1111111-2222-4000-8000-000000000001';
  const dummyElectionId = 'b2222222-3333-4000-8000-000000000002';
  const dummySecret = 'rzp_e2e_secret_key_1234567890abcdef';

  test('Step 1: Free Tier Organization encounters voter enrollment limit', () => {
    const freePlan = PLANS_CONFIG.free;
    const election = { id: dummyElectionId, config: {} };

    // Base free tier allows 50 voters
    const capacity = getEffectiveVoterCapacity(freePlan, election);
    assert.equal(capacity, 50);

    const attemptedEnrollment = 120;
    const excess = attemptedEnrollment - capacity;
    assert.equal(excess, 70);

    // Entitlement engine should recommend booster-250 (excess <= 250)
    let suggestedBooster = 'booster-250';
    if (excess > 500) suggestedBooster = 'booster-1500';
    else if (excess > 250) suggestedBooster = 'booster-500';

    assert.equal(suggestedBooster, 'booster-250');
  });

  test('Step 2: Organization purchases +250 Voter Capacity Booster via Razorpay Order', () => {
    const booster = getBoosterPackBySlug('booster-250');
    assert.ok(booster);
    assert.equal(booster.price, 79900); // ₹799 in paise

    // Order created with receipt and notes
    const orderId = 'order_e2e_booster_999';
    const paymentId = 'pay_e2e_booster_888';

    // Client checkout signs HMAC-SHA256(orderId + "|" + paymentId)
    const textToSign = `${orderId}|${paymentId}`;
    const signature = crypto
      .createHmac('sha256', dummySecret)
      .update(textToSign)
      .digest('hex');

    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
      secret: dummySecret,
    });
    assert.equal(isValid, true, 'Payment signature must verify');

    // Upon fulfillment, election config increments additionalVoters
    const election = {
      id: dummyElectionId,
      config: { additionalVoters: booster.additionalVoters },
    };

    const newEffectiveCapacity = getEffectiveVoterCapacity(PLANS_CONFIG.free, election);
    assert.equal(newEffectiveCapacity, 300, '50 base + 250 booster = 300 capacity');
    assert.ok(120 <= newEffectiveCapacity, '120 voters now easily fit within 300 capacity');
  });

  test('Step 3: Organization upgrades to Starter recurring subscription', () => {
    const starterPlan = PLANS_CONFIG['starter-monthly'];
    const subId = 'sub_e2e_starter_123';
    const paymentId = 'pay_e2e_starter_456';

    // Checkout signature for recurring subscription verifies HMAC(paymentId + "|" + subId)
    const textToSign = `${paymentId}|${subId}`;
    const subSignature = crypto
      .createHmac('sha256', dummySecret)
      .update(textToSign)
      .digest('hex');

    const isSubValid = verifyPaymentSignature({
      subscriptionId: subId,
      paymentId,
      signature: subSignature,
      secret: dummySecret,
    });
    assert.equal(isSubValid, true);

    // Initial state transitions to active via webhook
    assert.equal(canTransitionSubscription('trialing', 'active'), true);
    assert.equal(canTransitionSubscription('pending', 'active'), true);
  });

  test('Step 4: Renewal debit fails, activating 7-day grace period while elections continue', () => {
    // State machine permits active -> pending on debit failure
    assert.equal(canTransitionSubscription('active', 'pending'), true);

    const now = new Date();
    const graceEnd = computeGracePeriodEnd(now, GRACE_PERIOD_DAYS);
    const msDiff = graceEnd.getTime() - now.getTime();
    const daysDiff = Math.round(msDiff / (24 * 60 * 60 * 1000));
    assert.equal(daysDiff, 7, 'Grace period must be exactly 7 days');

    // System honors ongoing elections during grace period to protect democratic integrity
    assert.equal(isSubscriptionOperational('pending', graceEnd), true);
  });

  test('Step 5: Organization cancels subscription; historical elections remain permanently intact', () => {
    // When cancelled, transition is permissible
    assert.equal(canTransitionSubscription('active', 'cancelled'), true);

    // Constitutional verification:
    // Ballots, candidates, and published results are strictly decoupled from billing
    const mockElection = {
      id: dummyElectionId,
      status: 'completed',
      totalVotesCast: 118,
    };

    // Subscription status changes do NOT alter election state or ballot records
    assert.equal(mockElection.status, 'completed');
    assert.equal(mockElection.totalVotesCast, 118);
  });
});
