import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  SubscriptionPlan,
  OrganizationSubscription,
  Payment,
  Invoice,
  UsageRecord,
  WebhookEvent,
  Organization,
  User,
  Election,
  Vote,
} from '../models/index.js';

describe('VoteSphere Module 16.2: Billing Database & Sequelize Models Test Suite', () => {

  // =========================================================================
  // 1. SubscriptionPlan Model
  // =========================================================================
  describe('1. SubscriptionPlan Model Specifications', () => {
    test('verifies SubscriptionPlan table name, attributes, and primary key', () => {
      assert.equal(SubscriptionPlan.tableName, 'subscription_plans');
      assert.ok(SubscriptionPlan.rawAttributes.id, 'id attribute must exist');
      assert.equal(SubscriptionPlan.rawAttributes.id.primaryKey, true);
      assert.ok(SubscriptionPlan.rawAttributes.slug, 'slug attribute must exist');
      assert.ok(SubscriptionPlan.rawAttributes.price, 'price attribute must exist');
      assert.ok(SubscriptionPlan.rawAttributes.voterLimitPerElection, 'voterLimitPerElection must exist');
      assert.ok(SubscriptionPlan.rawAttributes.monthlyElectionAllowance, 'monthlyElectionAllowance must exist');
      assert.ok(SubscriptionPlan.rawAttributes.features, 'features must exist');
      assert.ok(SubscriptionPlan.rawAttributes.razorpayPlanId, 'razorpayPlanId must exist');
    });

    test('verifies slug lowercase transformation hook', async () => {
      const mockPlan = SubscriptionPlan.build({
        name: 'Test Plan',
        slug: '  Pro-MONTHLY  ',
      });
      // Trigger beforeValidate hook via Sequelize hook runner
      await SubscriptionPlan.runHooks('beforeValidate', mockPlan);
      assert.equal(mockPlan.slug, 'pro-monthly');
    });
  });

  // =========================================================================
  // 2. OrganizationSubscription Model
  // =========================================================================
  describe('2. OrganizationSubscription Model Specifications', () => {
    test('verifies OrganizationSubscription table name and attributes', () => {
      assert.equal(OrganizationSubscription.tableName, 'organization_subscriptions');
      assert.ok(OrganizationSubscription.rawAttributes.orgId, 'orgId FK must exist');
      assert.ok(OrganizationSubscription.rawAttributes.planId, 'planId FK must exist');
      assert.ok(OrganizationSubscription.rawAttributes.razorpaySubscriptionId, 'razorpaySubscriptionId must exist');
      assert.ok(OrganizationSubscription.rawAttributes.status, 'status must exist');
      assert.ok(OrganizationSubscription.rawAttributes.currentPeriodStart, 'currentPeriodStart must exist');
      assert.ok(OrganizationSubscription.rawAttributes.currentPeriodEnd, 'currentPeriodEnd must exist');
      assert.ok(OrganizationSubscription.rawAttributes.gracePeriodEnd, 'gracePeriodEnd must exist');
    });
  });

  // =========================================================================
  // 3. Payment & Invoice Models
  // =========================================================================
  describe('3. Payment & Invoice Model Specifications', () => {
    test('verifies Payment model attributes and gateway references', () => {
      assert.equal(Payment.tableName, 'payments');
      assert.ok(Payment.rawAttributes.razorpayPaymentId, 'razorpayPaymentId must exist');
      assert.equal(Payment.rawAttributes.razorpayPaymentId.allowNull, false);
      assert.ok(Payment.rawAttributes.amount, 'amount must exist');
      assert.ok(Payment.rawAttributes.paymentType, 'paymentType must exist');
      assert.ok(Payment.rawAttributes.status, 'status must exist');
    });

    test('verifies Invoice model attributes and GST breakdown columns', () => {
      assert.equal(Invoice.tableName, 'invoices');
      assert.ok(Invoice.rawAttributes.invoiceNumber, 'invoiceNumber must exist');
      assert.ok(Invoice.rawAttributes.subtotal, 'subtotal must exist');
      assert.ok(Invoice.rawAttributes.taxAmount, 'taxAmount must exist');
      assert.ok(Invoice.rawAttributes.total, 'total must exist');
      assert.ok(Invoice.rawAttributes.customerGstin, 'customerGstin must exist');
      assert.ok(Invoice.rawAttributes.billingName, 'billingName must exist');
    });
  });

  // =========================================================================
  // 4. UsageRecord & WebhookEvent Models
  // =========================================================================
  describe('4. UsageRecord & WebhookEvent Model Specifications', () => {
    test('verifies UsageRecord model attributes and indexes', () => {
      assert.equal(UsageRecord.tableName, 'usage_records');
      assert.ok(UsageRecord.rawAttributes.usageType, 'usageType must exist');
      assert.ok(UsageRecord.rawAttributes.quantity, 'quantity must exist');
      assert.ok(UsageRecord.rawAttributes.billingPeriodMonth, 'billingPeriodMonth must exist');
    });

    test('verifies WebhookEvent model attributes and status tracking', () => {
      assert.equal(WebhookEvent.tableName, 'webhook_events');
      assert.ok(WebhookEvent.rawAttributes.provider, 'provider must exist');
      assert.ok(WebhookEvent.rawAttributes.eventId, 'eventId must exist');
      assert.ok(WebhookEvent.rawAttributes.processingStatus, 'processingStatus must exist');
      assert.ok(WebhookEvent.rawAttributes.payload, 'payload must exist');
    });
  });

  // =========================================================================
  // 5. Model Associations & Constitutional Ballot Privacy
  // =========================================================================
  describe('5. Model Associations & Constitutional Ballot Privacy', () => {
    test('verifies Organization relationships with subscriptions, payments, and invoices', () => {
      assert.ok(Organization.associations.subscriptions, 'Organization hasMany subscriptions');
      assert.ok(Organization.associations.payments, 'Organization hasMany payments');
      assert.ok(Organization.associations.invoices, 'Organization hasMany invoices');
      assert.ok(Organization.associations.usageRecords, 'Organization hasMany usageRecords');

      assert.ok(OrganizationSubscription.associations.organization, 'OrganizationSubscription belongsTo Organization');
      assert.ok(OrganizationSubscription.associations.plan, 'OrganizationSubscription belongsTo SubscriptionPlan');
    });

    test('verifies Payment <-> Invoice 1-to-1 association', () => {
      assert.ok(Payment.associations.invoice, 'Payment hasOne Invoice');
      assert.ok(Invoice.associations.payment, 'Invoice belongsTo Payment');
    });

    test('CONSTITUTIONAL PRIVACY GUARANTEE: Zero linkage between Votes and Payment/Invoice models', () => {
      // Ballot secrecy: Votes table MUST NOT reference payments, invoices, or subscriptions
      assert.equal(Vote.associations.payments, undefined, 'Vote must NOT associate with payments');
      assert.equal(Vote.associations.invoices, undefined, 'Vote must NOT associate with invoices');
      assert.equal(Vote.associations.subscriptions, undefined, 'Vote must NOT associate with subscriptions');

      assert.equal(Payment.associations.votes, undefined, 'Payment must NOT associate with votes');
      assert.equal(Invoice.associations.votes, undefined, 'Invoice must NOT associate with votes');
    });
  });
});

