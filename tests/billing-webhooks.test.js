import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateSequentialInvoiceNumber,
  handleSubscriptionCharged,
  handleSubscriptionPending,
  handleSubscriptionHalted,
  handleSubscriptionCancelled,
  handleOrderPaid,
} from '../lib/billing/webhook-handlers.js';

import {
  OrganizationSubscription,
  SubscriptionPlan,
  Organization,
  Payment,
  Invoice,
  Election,
} from '../models/index.js';

import { PLANS_CONFIG } from '../lib/billing/plans-config.js';

describe('VoteSphere Module 16.5: Webhooks & Payment Processing Test Suite', () => {
  const originalMethods = {};

  beforeEach(() => {
    originalMethods.subFindOne = OrganizationSubscription.findOne;
    originalMethods.subCreate = OrganizationSubscription.create;
    originalMethods.planFindOne = SubscriptionPlan.findOne;
    originalMethods.paymentFindOrCreate = Payment.findOrCreate;
    originalMethods.paymentCreate = Payment.create;
    originalMethods.invoiceCount = Invoice.count;
    originalMethods.invoiceCreate = Invoice.create;
    originalMethods.electionFindByPk = Election.findByPk;
  });

  afterEach(() => {
    OrganizationSubscription.findOne = originalMethods.subFindOne;
    OrganizationSubscription.create = originalMethods.subCreate;
    SubscriptionPlan.findOne = originalMethods.planFindOne;
    Payment.findOrCreate = originalMethods.paymentFindOrCreate;
    Payment.create = originalMethods.paymentCreate;
    Invoice.count = originalMethods.invoiceCount;
    Invoice.create = originalMethods.invoiceCreate;
    Election.findByPk = originalMethods.electionFindByPk;
  });

  // =========================================================================
  // 1. Sequential Invoice Generation
  // =========================================================================
  describe('1. Sequential GST Tax Invoice Number Generation', () => {
    test('generates formatted sequential invoice number matching VS-INV-YYYYMM-XXXXX', async () => {
      Invoice.count = async () => 42;

      const invoiceNo = await generateSequentialInvoiceNumber();
      assert.match(invoiceNo, /^VS-INV-\d{6}-00043$/, 'Invoice number must format with 5-digit sequence');
    });
  });

  // =========================================================================
  // 2. subscription.charged Event Handler
  // =========================================================================
  describe('2. subscription.charged Webhook Handler', () => {
    test('extends subscription period, sets active status, records payment, and creates GST invoice', async () => {
      let savedSub = false;
      let createdPayment = false;
      let createdInvoice = null;

      const mockSubscription = {
        id: 'sub-db-123',
        orgId: 'org-abc-456',
        status: 'pending',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        gracePeriodEnd: new Date(),
        plan: PLANS_CONFIG['starter-monthly'],
        organization: {
          name: 'Apex Academy',
          owner: { email: 'owner@apex.edu', name: 'Dean' },
        },
        save: async () => {
          savedSub = true;
        },
      };

      OrganizationSubscription.findOne = async () => mockSubscription;
      Payment.findOrCreate = async () => {
        createdPayment = true;
        return [{ id: 'pay-db-789' }, true];
      };
      Invoice.count = async () => 10;
      Invoice.create = async (data) => {
        createdInvoice = data;
        return data;
      };

      const nowEpoch = Math.floor(Date.now() / 1000);
      const nextMonthEpoch = nowEpoch + 30 * 86400;

      const payload = {
        subscription: {
          entity: {
            id: 'sub_rzp_real_123',
            current_start: nowEpoch,
            current_end: nextMonthEpoch,
            plan: { amount: 149900 },
          },
        },
        payment: {
          entity: {
            id: 'pay_rzp_real_789',
            amount: 149900,
            currency: 'INR',
            method: 'card',
            email: 'owner@apex.edu',
          },
        },
      };

      const result = await handleSubscriptionCharged(payload);

      assert.equal(result.handled, true);
      assert.equal(savedSub, true, 'Subscription must be saved');
      assert.equal(mockSubscription.status, 'active', 'Subscription must become active');
      assert.equal(mockSubscription.gracePeriodEnd, null, 'Grace period must be cleared');
      assert.ok(mockSubscription.currentPeriodStart);
      assert.ok(mockSubscription.currentPeriodEnd);
      assert.equal(createdPayment, true, 'Payment row must be created');
      assert.ok(createdInvoice, 'Invoice row must be created');
      assert.equal(createdInvoice.totalAmount, 149900);
      assert.equal(createdInvoice.status, 'paid');
      // 18% inclusive GST check: tax = round(149900 * 18 / 118) = 22866
      assert.equal(createdInvoice.taxAmount, 22866);
      assert.equal(createdInvoice.subtotal, 149900 - 22866);
    });
  });

  // =========================================================================
  // 3. subscription.pending Event Handler (7-Day Grace Period)
  // =========================================================================
  describe('3. subscription.pending Webhook Handler (7-Day Grace Period)', () => {
    test('transitions subscription to pending with 7-day grace period on renewal debit failure', async () => {
      let savedSub = false;

      const mockSubscription = {
        id: 'sub-db-123',
        orgId: 'org-abc-456',
        status: 'active',
        gracePeriodEnd: null,
        plan: PLANS_CONFIG['pro-monthly'],
        organization: {
          name: 'St. Jude College',
          owner: { email: 'admin@stjude.ac.in', name: 'Admin' },
        },
        save: async () => {
          savedSub = true;
        },
      };

      OrganizationSubscription.findOne = async () => mockSubscription;
      Payment.create = async () => ({ id: 'pay-fail-1' });

      const payload = {
        subscription: {
          entity: {
            id: 'sub_rzp_failing_123',
          },
        },
        payment: {
          entity: {
            id: 'pay_rzp_failed_123',
            amount: 499900,
            currency: 'INR',
            method: 'card',
            error_description: 'Card expired',
          },
        },
      };

      const result = await handleSubscriptionPending(payload);

      assert.equal(result.handled, true);
      assert.equal(result.status, 'pending');
      assert.equal(savedSub, true);
      assert.equal(mockSubscription.status, 'pending');
      assert.ok(mockSubscription.gracePeriodEnd, 'Grace period end date must be set');
      
      const diffMs = mockSubscription.gracePeriodEnd.getTime() - Date.now();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      assert.ok(diffDays >= 6.9 && diffDays <= 7.1, 'Grace period must be exactly 7 days');
    });
  });

  // =========================================================================
  // 4. subscription.halted & subscription.cancelled Handlers
  // =========================================================================
  describe('4. subscription.halted & cancellation Handlers', () => {
    test('transitions subscription to halted when retries are exhausted', async () => {
      let savedSub = false;
      const mockSubscription = {
        id: 'sub-db-halt',
        status: 'pending',
        save: async () => {
          savedSub = true;
        },
      };

      OrganizationSubscription.findOne = async () => mockSubscription;

      const payload = {
        subscription: {
          entity: { id: 'sub_rzp_exhausted' },
        },
      };

      const result = await handleSubscriptionHalted(payload);
      assert.equal(result.handled, true);
      assert.equal(mockSubscription.status, 'halted');
      assert.equal(savedSub, true);
    });

    test('sets cancellation status and records cancellationDate', async () => {
      let savedSub = false;
      const mockSubscription = {
        id: 'sub-db-cancel',
        status: 'active',
        cancellationDate: null,
        organization: { owner: { email: 'owner@test.com' } },
        save: async () => {
          savedSub = true;
        },
      };

      OrganizationSubscription.findOne = async () => mockSubscription;

      const payload = {
        subscription: {
          entity: { id: 'sub_rzp_cancel' },
        },
      };

      const result = await handleSubscriptionCancelled(payload);
      assert.equal(result.handled, true);
      assert.equal(mockSubscription.status, 'cancelled');
      assert.ok(mockSubscription.cancellationDate);
      assert.equal(savedSub, true);
    });
  });

  // =========================================================================
  // 5. order.paid Handler (Event Pass & Booster Credits)
  // =========================================================================
  describe('5. order.paid Webhook Handler (One-Time Purchases & Add-ons)', () => {
    test('fulfills 30-day Event Pass purchase', async () => {
      let createdSub = null;
      let createdPayment = null;
      let createdInvoice = null;

      SubscriptionPlan.findOne = async () => ({ id: 'plan-event-pass-id', slug: 'event-pass' });
      Payment.findOrCreate = async (opts) => {
        createdPayment = opts.defaults;
        return [{ id: 'pay-db-pass' }, true];
      };
      Invoice.count = async () => 5;
      Invoice.create = async (data) => {
        createdInvoice = data;
        return data;
      };
      OrganizationSubscription.create = async (data) => {
        createdSub = data;
        return data;
      };

      const payload = {
        order: {
          entity: {
            id: 'order_rzp_event_pass',
            amount: 299900,
            notes: {
              order_type: 'event_pass',
              organization_id: 'org-rwa-housing-uuid',
            },
          },
        },
        payment: {
          entity: {
            id: 'pay_rzp_event_pass',
            amount: 299900,
            currency: 'INR',
            method: 'upi',
          },
        },
      };

      const result = await handleOrderPaid(payload);
      assert.equal(result.handled, true);
      assert.equal(result.orderType, 'event_pass');
      assert.ok(createdSub, 'Organization subscription should be created for 30-day Event Pass');
      assert.equal(createdSub.status, 'active');
      assert.equal(createdSub.billingInterval, 'once');
      assert.ok(createdPayment);
      assert.ok(createdInvoice);
    });

    test('fulfills voter booster credits by incrementing election.config.additionalVoters', async () => {
      let savedElection = false;
      const mockElection = {
        id: 'elec-university-agm',
        config: {
          additionalVoters: 250,
        },
        save: async () => {
          savedElection = true;
        },
      };

      Election.findByPk = async () => mockElection;
      Payment.findOrCreate = async () => [{ id: 'pay-booster' }, true];
      Invoice.count = async () => 6;
      Invoice.create = async (data) => data;

      const payload = {
        order: {
          entity: {
            id: 'order_rzp_booster',
            amount: 129900,
            notes: {
              order_type: 'booster',
              organization_id: 'org-uni-uuid',
              election_id: 'elec-university-agm',
              voter_allowance: '500',
            },
          },
        },
        payment: {
          entity: {
            id: 'pay_rzp_booster',
            amount: 129900,
            currency: 'INR',
          },
        },
      };

      const result = await handleOrderPaid(payload);
      assert.equal(result.handled, true);
      assert.equal(savedElection, true, 'Election must be saved');
      assert.equal(mockElection.config.additionalVoters, 750, '250 + 500 should equal 750 additional voters');
    });
  });
});

