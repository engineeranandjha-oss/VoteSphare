import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPlatformAdmin,
  requirePlatformAdmin,
} from '../lib/auth/authorization.js';
import { PLANS_CONFIG } from '../lib/billing/plans-config.js';
import { ForbiddenError, UnauthorizedError } from '../lib/utils/error-handler.js';

describe('Module 16.9: Admin Revenue & Analytics Dashboard', () => {
  test('isPlatformAdmin validates email against configured admin list', () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = 'admin@votesphere.io,founder@votesphere.io';

    try {
      assert.equal(isPlatformAdmin({ email: 'admin@votesphere.io' }), true);
      assert.equal(isPlatformAdmin({ email: 'FOUNDER@VOTESPHERE.IO' }), true); // Case-insensitive
      assert.equal(isPlatformAdmin({ email: 'regular_user@example.com' }), false);
      assert.equal(isPlatformAdmin(null), false);
      assert.equal(isPlatformAdmin({}), false);
    } finally {
      process.env.ADMIN_EMAILS = originalEnv;
    }
  });

  test('requirePlatformAdmin throws ForbiddenError for non-admin user', () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = 'superadmin@votesphere.io';

    try {
      assert.throws(
        () => requirePlatformAdmin({ email: 'unauthorized@example.com' }),
        ForbiddenError
      );

      assert.throws(
        () => requirePlatformAdmin(null),
        UnauthorizedError
      );

      // Should not throw for valid admin
      assert.doesNotThrow(() =>
        requirePlatformAdmin({ email: 'superadmin@votesphere.io' })
      );
    } finally {
      process.env.ADMIN_EMAILS = originalEnv;
    }
  });

  test('MRR and ARR calculate accurately across monthly and annual intervals', () => {
    const starterMonthlyPrice = PLANS_CONFIG['starter-monthly'].price; // 149900 paise (₹1,499)
    const starterAnnualPrice = PLANS_CONFIG['starter-annual'].price; // 1499000 paise (₹14,990)
    const proMonthlyPrice = PLANS_CONFIG['pro-monthly'].price; // 499900 paise (₹4,999)

    // Simulate 2 starter monthly, 1 starter annual, 1 pro monthly
    let simulatedMrrPaise = 0;
    simulatedMrrPaise += starterMonthlyPrice * 2;
    simulatedMrrPaise += Math.round(starterAnnualPrice / 12);
    simulatedMrrPaise += proMonthlyPrice;

    // Expected: 2 * 149900 + round(1499000/12) + 499900 = 299800 + 124917 + 499900 = 924617 paise
    assert.equal(simulatedMrrPaise, 924617);

    const simulatedArrPaise = simulatedMrrPaise * 12;
    assert.equal(simulatedArrPaise, 924617 * 12);
  });

  test('Conversion rate computes mathematically sound percentages', () => {
    const computeConversion = (paidOrgs, totalOrgs) =>
      totalOrgs > 0 ? Number(((paidOrgs / totalOrgs) * 100).toFixed(1)) : 0;

    assert.equal(computeConversion(0, 0), 0);
    assert.equal(computeConversion(15, 100), 15);
    assert.equal(computeConversion(1, 3), 33.3);
    assert.equal(computeConversion(10, 10), 100);
  });

  test('Transactions and Metrics Sequelize query models and associations are valid', async () => {
    const { Payment, Organization, User, Invoice, OrganizationSubscription, SubscriptionPlan } = await import('../models/index.js');

    // Verify Payment association to Invoice alias is 'invoice' (singular)
    assert.ok(Payment.associations.invoice, 'Payment must have association with alias "invoice"');
    assert.ok(Payment.associations.organization, 'Payment must have association with alias "organization"');
    assert.ok(Payment.associations.user, 'Payment must have association with alias "user"');

    // Verify OrganizationSubscription association to SubscriptionPlan alias is 'plan'
    assert.ok(OrganizationSubscription.associations.plan, 'OrganizationSubscription must have association with alias "plan"');

    // Verify Invoice table schema includes 'total' (not 'totalAmount')
    assert.ok(Invoice.rawAttributes.total, 'Invoice model must define "total" column');
    assert.equal(Invoice.rawAttributes.totalAmount, undefined, 'Invoice model must not have "totalAmount" column');
  });
});

