import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  orderCreateSchema,
  orderVerifySchema,
} from '../lib/validations/index.js';
import {
  getBoosterPackBySlug,
  PLANS_CONFIG,
  VOTER_BOOSTER_PACKS,
  formatPriceInr,
} from '../lib/billing/plans-config.js';
import {
  verifyPaymentSignature,
} from '../lib/billing/razorpay.js';
import {
  handleRefundProcessed,
  processWebhookEvent,
} from '../lib/billing/webhook-handlers.js';
import {
  sequelize,
  Payment,
  Invoice,
} from '../models/index.js';
import {
  getEffectiveVoterCapacity,
} from '../lib/billing/entitlements.js';
import crypto from 'node:crypto';

describe('Module 16.8: One-Time Purchases & Voter Capacity Boosters', () => {
  const dummyOrgId = 'a0000000-0000-4000-8000-000000000001';
  const dummyElectionId = 'b0000000-0000-4000-8000-000000000002';
  const testSecret = 'rzp_test_secret_for_unit_tests_1234567890';

  test('orderCreateSchema accepts valid voter_booster payload', () => {
    const validBooster = {
      orgId: dummyOrgId,
      orderType: 'voter_booster',
      boosterSlug: 'booster-250',
      electionId: dummyElectionId,
      customerGstin: '29ABCDE1234F1Z5',
    };

    const parsed = orderCreateSchema.parse(validBooster);
    assert.equal(parsed.orgId, dummyOrgId);
    assert.equal(parsed.orderType, 'voter_booster');
    assert.equal(parsed.boosterSlug, 'booster-250');
  });

  test('orderCreateSchema rejects voter_booster without boosterSlug', () => {
    const invalidBooster = {
      orgId: dummyOrgId,
      orderType: 'voter_booster',
      electionId: dummyElectionId,
    };

    assert.throws(
      () => orderCreateSchema.parse(invalidBooster),
      /boosterSlug is required/
    );
  });

  test('orderCreateSchema accepts valid event_pass payload', () => {
    const validEventPass = {
      orgId: dummyOrgId,
      orderType: 'event_pass',
    };

    const parsed = orderCreateSchema.parse(validEventPass);
    assert.equal(parsed.orderType, 'event_pass');
    assert.equal(parsed.orgId, dummyOrgId);
  });

  test('orderVerifySchema accepts valid verification payload', () => {
    const validVerify = {
      orgId: dummyOrgId,
      electionId: dummyElectionId,
      razorpay_order_id: 'order_test_123',
      razorpay_payment_id: 'pay_test_456',
      razorpay_signature: 'abc123sig',
    };

    const parsed = orderVerifySchema.parse(validVerify);
    assert.equal(parsed.razorpay_order_id, 'order_test_123');
    assert.equal(parsed.razorpay_payment_id, 'pay_test_456');
    assert.equal(parsed.razorpay_signature, 'abc123sig');
  });

  test('getBoosterPackBySlug resolves packs and pricing accurately', () => {
    const b250 = getBoosterPackBySlug('booster-250');
    assert.ok(b250);
    assert.equal(b250.additionalVoters, 250);
    assert.equal(b250.price, 79900); // ₹799 in paise

    const b500 = getBoosterPackBySlug('booster-500');
    assert.ok(b500);
    assert.equal(b500.additionalVoters, 500);
    assert.equal(b500.price, 129900); // ₹1,299

    const b1500 = getBoosterPackBySlug('booster-1500');
    assert.ok(b1500);
    assert.equal(b1500.additionalVoters, 1500);
    assert.equal(b1500.price, 299900); // ₹2,999

    assert.equal(getBoosterPackBySlug('nonexistent'), null);
  });

  test('getEffectiveVoterCapacity combines plan limit and election booster', () => {
    const freePlan = PLANS_CONFIG.free; // 50 voters
    const electionNoBoost = { config: {} };
    assert.equal(getEffectiveVoterCapacity(freePlan, electionNoBoost), 50);

    const electionWithBoost = { config: { additionalVoters: 500 } };
    assert.equal(getEffectiveVoterCapacity(freePlan, electionWithBoost), 550);

    const proPlan = PLANS_CONFIG['pro-monthly']; // 1500 voters
    assert.equal(getEffectiveVoterCapacity(proPlan, electionWithBoost), 2000);
  });

  test('verifyPaymentSignature validates Razorpay order signature with orderId|paymentId', () => {
    const orderId = 'order_M123456789';
    const paymentId = 'pay_P987654321';
    const textToSign = `${orderId}|${paymentId}`;
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(textToSign)
      .digest('hex');

    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: validSignature,
      secret: testSecret,
    });

    assert.equal(isValid, true);

    const isTampered = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: 'wrong_tampered_signature_hex_value_1234567890abcdef',
      secret: testSecret,
    });

    assert.equal(isTampered, false);
  });

  test('handleRefundProcessed skips when payment ID missing', async () => {
    const result = await handleRefundProcessed({});
    assert.equal(result.skipped, true);
    assert.match(result.reason, /Missing payment ID/);
  });

  test('handleRefundProcessed updates payment to refunded and voids invoice', async () => {
    let savedPayment = false;
    let savedInvoice = false;

    const mockPayment = {
      id: 'pay-db-refund-test',
      status: 'captured',
      razorpayPaymentId: 'pay_refund_123',
      metadata: {},
      save: async () => {
        savedPayment = true;
      },
    };

    const mockInvoice = {
      id: 'inv-db-refund-test',
      status: 'paid',
      metadata: {},
      save: async () => {
        savedInvoice = true;
      },
    };

    const originalPaymentFindOne = Payment.findOne;
    const originalInvoiceFindOne = Invoice.findOne;

    Payment.findOne = async () => mockPayment;
    Invoice.findOne = async () => mockInvoice;

    try {
      const refundPayload = {
        refund: {
          entity: {
            id: 'rfnd_unit_test_001',
            payment_id: 'pay_refund_123',
            amount: 79900,
            status: 'processed',
          },
        },
      };

      const result = await handleRefundProcessed(refundPayload);
      assert.equal(result.handled, true);
      assert.equal(result.status, 'refunded');
      assert.equal(mockPayment.status, 'refunded');
      assert.equal(mockInvoice.status, 'void');
      assert.equal(savedPayment, true);
      assert.equal(savedInvoice, true);
    } finally {
      Payment.findOne = originalPaymentFindOne;
      Invoice.findOne = originalInvoiceFindOne;
    }
  });

  test('processWebhookEvent dispatches refund.processed via transaction', async () => {
    const originalTransaction = sequelize.transaction;
    sequelize.transaction = async (fn) => fn({});

    const originalPaymentFindOne = Payment.findOne;
    Payment.findOne = async () => null;

    try {
      const refundPayload = {
        refund: {
          entity: {
            id: 'rfnd_unit_test_002',
            payment_id: 'pay_nonexistent_for_test',
            amount: 79900,
            status: 'processed',
          },
        },
      };

      const result = await processWebhookEvent({
        eventId: 'evt_refund_002',
        eventType: 'refund.processed',
        payload: refundPayload,
      });

      assert.ok(result.skipped);
      assert.match(result.reason, /not found in database/);
    } finally {
      sequelize.transaction = originalTransaction;
      Payment.findOne = originalPaymentFindOne;
    }
  });
});
