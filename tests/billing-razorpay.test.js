process.env.NODE_ENV = 'test';

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  getRazorpayClient,
  createRazorpaySubscription,
  createRazorpayOrder,
  cancelRazorpaySubscription,
  normalizeGatewayError,
} from '../lib/billing/razorpay.js';
import {
  PaymentGatewayError,
  handleApiError,
} from '../lib/utils/error-handler.js';

describe('VoteSphere Module 16.4: Razorpay Gateway Integration Test Suite', () => {
  const TEST_SECRET = 'rzp_test_secret_key_1234567890abcdef';
  const TEST_WEBHOOK_SECRET = 'whsec_test_webhook_secret_9876543210';

  // =========================================================================
  // 1. Payment Signature Verification
  // =========================================================================
  describe('1. Payment HMAC-SHA256 Signature Verification (verifyPaymentSignature)', () => {
    test('verifies valid subscription checkout signature', () => {
      const paymentId = 'pay_N123456789';
      const subscriptionId = 'sub_N987654321';
      const expectedText = `${paymentId}|${subscriptionId}`;

      const validSignature = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(expectedText)
        .digest('hex');

      const isValid = verifyPaymentSignature({
        subscriptionId,
        paymentId,
        signature: validSignature,
        secret: TEST_SECRET,
      });

      assert.equal(isValid, true, 'Valid subscription signature must verify successfully');
    });

    test('verifies valid one-time order checkout signature', () => {
      const orderId = 'order_N111222333';
      const paymentId = 'pay_N444555666';
      const expectedText = `${orderId}|${paymentId}`;

      const validSignature = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(expectedText)
        .digest('hex');

      const isValid = verifyPaymentSignature({
        orderId,
        paymentId,
        signature: validSignature,
        secret: TEST_SECRET,
      });

      assert.equal(isValid, true, 'Valid order signature must verify successfully');
    });

    test('rejects forged or tampered signature', () => {
      const orderId = 'order_N111222333';
      const paymentId = 'pay_N444555666';
      const forgedSignature = 'forged_invalid_hex_signature_00000000000000000000000000000000';

      const isValid = verifyPaymentSignature({
        orderId,
        paymentId,
        signature: forgedSignature,
        secret: TEST_SECRET,
      });

      assert.equal(isValid, false, 'Forged signature must fail verification');
    });

    test('rejects signature when signed with incorrect secret', () => {
      const paymentId = 'pay_N123456789';
      const subscriptionId = 'sub_N987654321';
      const wrongSecret = 'wrong_secret_key';

      const signature = crypto
        .createHmac('sha256', wrongSecret)
        .update(`${paymentId}|${subscriptionId}`)
        .digest('hex');

      const isValid = verifyPaymentSignature({
        subscriptionId,
        paymentId,
        signature,
        secret: TEST_SECRET,
      });

      assert.equal(isValid, false, 'Signature with wrong secret must fail');
    });

    test('handles missing or malformed parameters safely without throwing', () => {
      assert.equal(verifyPaymentSignature({}), false);
      assert.equal(verifyPaymentSignature({ paymentId: 'pay_123' }), false);
      assert.equal(verifyPaymentSignature({ signature: 'sig_123' }), false);
    });
  });

  // =========================================================================
  // 2. Webhook Signature Verification
  // =========================================================================
  describe('2. Webhook HMAC-SHA256 Signature Verification (verifyWebhookSignature)', () => {
    const samplePayload = JSON.stringify({
      entity: 'event',
      account_id: 'acc_123',
      event: 'subscription.charged',
      contains: ['subscription', 'payment'],
      payload: {
        subscription: { entity: { id: 'sub_123', status: 'active' } },
        payment: { entity: { id: 'pay_123', amount: 499900 } },
      },
      created_at: 1714800000,
    });

    test('verifies authentic webhook payload with matching signature', () => {
      const validSignature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(samplePayload)
        .digest('hex');

      const isValid = verifyWebhookSignature(samplePayload, validSignature, TEST_WEBHOOK_SECRET);
      assert.equal(isValid, true, 'Authentic webhook signature must verify');
    });

    test('rejects webhook payload if payload was altered (replay/tamper defense)', () => {
      const validSignature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(samplePayload)
        .digest('hex');

      const tamperedPayload = samplePayload.replace('499900', '199900');

      const isValid = verifyWebhookSignature(tamperedPayload, validSignature, TEST_WEBHOOK_SECRET);
      assert.equal(isValid, false, 'Tampered webhook payload must fail verification');
    });

    test('handles null, undefined, or empty payload safely', () => {
      assert.equal(verifyWebhookSignature(null, 'sig'), false);
      assert.equal(verifyWebhookSignature('', 'sig'), false);
      assert.equal(verifyWebhookSignature('payload', null), false);
    });
  });

  // =========================================================================
  // 3. Client Singleton & Helper Wrappers
  // =========================================================================
  describe('3. Razorpay Client Singleton & API Wrappers', () => {
    test('initializes client gracefully with fallback methods in testing', async () => {
      const client = await getRazorpayClient();
      assert.ok(client, 'Client should exist');
      assert.ok(client.subscriptions, 'Client should have subscriptions namespace');
      assert.ok(client.orders, 'Client should have orders namespace');
      assert.ok(client.payments, 'Client should have payments namespace');
    });

    test('creates subscription via wrapper', async () => {
      const sub = await createRazorpaySubscription({
        planId: 'plan_pro_monthly',
        totalCount: 120,
        customerNotify: 1,
        notes: { orgId: 'org-test-uuid' },
      });

      assert.ok(sub, 'Subscription object should be returned');
      assert.ok(sub.id, 'Subscription should have an ID');
      assert.equal(sub.plan_id, 'plan_pro_monthly');
    });

    test('creates one-time order via wrapper', async () => {
      const order = await createRazorpayOrder({
        amount: 299900,
        currency: 'INR',
        receipt: 'rcpt_event_123',
        notes: { orderType: 'event_pass' },
      });

      assert.ok(order, 'Order object should be returned');
      assert.ok(order.id, 'Order should have an ID');
      assert.equal(order.amount, 299900);
      assert.equal(order.currency, 'INR');
    });

    test('cancels subscription via wrapper', async () => {
      const cancelled = await cancelRazorpaySubscription('sub_test_123', true);
      assert.ok(cancelled, 'Cancellation result should be returned');
      assert.equal(cancelled.cancel_at_cycle_end, true);
    });
  });

  // =========================================================================
  // 4. Payment Gateway Error Normalization & API Error Handling
  // =========================================================================
  describe('4. Payment Gateway Error Normalization & API Error Handling', () => {
    test('normalizes raw Razorpay 401 Unauthorized object to PaymentGatewayError (502)', () => {
      const rawRzpError = { statusCode: 401, error: 'Unauthorized' };
      const normalized = normalizeGatewayError(rawRzpError, 'Razorpay Subscriptions');

      assert.ok(normalized instanceof PaymentGatewayError);
      assert.equal(normalized.statusCode, 502);
      assert.match(normalized.message, /Subscriptions feature may not be activated/i);
      assert.equal(normalized.errors?.provider, 'razorpay');
      assert.equal(normalized.errors?.statusCode, 401);
    });

    test('normalizes raw Razorpay 400 Bad Request error object', () => {
      const rawRzpError = {
        statusCode: 400,
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'The plan_id provided does not exist',
        },
      };
      const normalized = normalizeGatewayError(rawRzpError, 'Razorpay Subscriptions');

      assert.ok(normalized instanceof PaymentGatewayError);
      assert.equal(normalized.statusCode, 400);
      assert.match(normalized.message, /The plan_id provided does not exist/);
    });

    test('handleApiError catches raw Razorpay { statusCode: 401, error: "Unauthorized" } and returns 502', async () => {
      const rawRzpError = { statusCode: 401, error: 'Unauthorized' };
      const response = handleApiError(rawRzpError);

      assert.equal(response.status, 502, 'Should return HTTP 502 Bad Gateway instead of 500');
      const body = await response.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Payment gateway authorization failed/i);
      assert.equal(body.errors, 'Unauthorized');
    });

    test('handleApiError catches PaymentGatewayError and returns defined status and details', async () => {
      const gatewayErr = new PaymentGatewayError('Razorpay plan unavailable', 502, {
        provider: 'razorpay',
        plan: 'starter-monthly',
      });
      const response = handleApiError(gatewayErr);

      assert.equal(response.status, 502);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.message, 'Razorpay plan unavailable');
      assert.equal(body.errors?.provider, 'razorpay');
    });
  });
});

