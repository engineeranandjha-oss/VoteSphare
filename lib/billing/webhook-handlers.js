import { Op } from 'sequelize';
import {
  sequelize,
  OrganizationSubscription,
  SubscriptionPlan,
  Organization,
  User,
  Payment,
  Invoice,
  Election,
} from '../../models/index.js';
import {
  sendSubscriptionSuccessEmail,
  sendPaymentFailedGracePeriodEmail,
  sendSubscriptionCancelledEmail,
} from '../email/billing-notifications.js';

/**
 * Generates a sequential, financial-year-compliant GST tax invoice number.
 * Format: VS-INV-YYYYMM-XXXXX (e.g. VS-INV-202611-00001)
 *
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<string>}
 */
export async function generateSequentialInvoiceNumber(transaction = null) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const count = await Invoice.count({ transaction });
  const sequence = String(count + 1).padStart(5, '0');
  
  return `VS-INV-${yearMonth}-${sequence}`;
}

/**
 * Handles 'subscription.charged' webhook event.
 * Executes atomically: extends billing period, transitions status to 'active',
 * records payment transaction, generates sequential GST invoice, and notifies owner.
 *
 * @param {Object} payload - Razorpay event payload
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Object>}
 */
export async function handleSubscriptionCharged(payload, transaction = null) {
  const subEntity = payload?.subscription?.entity || {};
  const payEntity = payload?.payment?.entity || {};

  const subId = subEntity.id;
  const paymentId = payEntity.id;
  const amount = payEntity.amount || subEntity.plan?.amount || 0;
  const currency = payEntity.currency || 'INR';
  const method = payEntity.method || 'card';

  if (!subId) {
    return { skipped: true, reason: 'Missing subscription ID in payload' };
  }

  // 1. Locate local OrganizationSubscription
  const subscription = await OrganizationSubscription.findOne({
    where: { razorpaySubscriptionId: subId },
    include: [
      { model: SubscriptionPlan, as: 'plan' },
      {
        model: Organization,
        as: 'organization',
        include: [{ model: User, as: 'owner', attributes: ['id', 'email', 'name'] }],
      },
    ],
    transaction,
  });

  if (!subscription) {
    return { skipped: true, reason: `Subscription ${subId} not found in database` };
  }

  // 2. Extend subscription dates and clear grace period
  const periodStart = subEntity.current_start
    ? new Date(subEntity.current_start * 1000)
    : new Date();
  const periodEnd = subEntity.current_end
    ? new Date(subEntity.current_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  subscription.status = 'active';
  subscription.currentPeriodStart = periodStart;
  subscription.currentPeriodEnd = periodEnd;
  subscription.gracePeriodEnd = null;
  await subscription.save({ transaction });

  // 3. Insert captured Payment row
  const [payment] = await Payment.findOrCreate({
    where: { razorpayPaymentId: paymentId || `pay_${Date.now()}` },
    defaults: {
      orgId: subscription.orgId,
      userId: subscription.organization?.ownerId || null,
      subscriptionId: subscription.id,
      razorpayPaymentId: paymentId || `pay_${Date.now()}`,
      razorpaySubscriptionId: subId,
      amount,
      currency,
      status: 'captured',
      paymentMethod: method,
      paymentType: 'subscription',
      metadata: {
        rawPayment: payEntity,
      },
    },
    transaction,
  });

  // 4. Compute 18% GST breakdown (SAC Code 998313 for Cloud SaaS)
  const totalAmount = amount;
  const taxAmount = Math.round((totalAmount * 18) / 118);
  const subtotal = totalAmount - taxAmount;

  // 5. Generate sequential GST tax invoice
  const invoiceNumber = await generateSequentialInvoiceNumber(transaction);
  const invoice = await Invoice.create(
    {
      orgId: subscription.orgId,
      paymentId: payment.id,
      subscriptionId: subscription.id,
      invoiceNumber,
      subtotal,
      taxAmount,
      totalAmount,
      currency,
      status: 'paid',
      billingDetails: {
        sacCode: '998313',
        gstRate: '18%',
        payerEmail: payEntity.email || subscription.organization?.owner?.email,
        payerName: subscription.organization?.name,
      },
      issuedAt: new Date(),
      paidAt: new Date(),
    },
    { transaction }
  );

  // 6. Asynchronous email receipt dispatch (graceful, non-blocking)
  const recipientEmail =
    payEntity.email || subscription.organization?.owner?.email;
  if (recipientEmail) {
    sendSubscriptionSuccessEmail({
      to: recipientEmail,
      orgName: subscription.organization?.name,
      planName: subscription.plan?.name,
      amountInPaise: totalAmount,
      invoiceNumber: invoice.invoiceNumber,
      periodEnd: subscription.currentPeriodEnd,
    }).catch(() => {});
  }

  return {
    handled: true,
    subscriptionId: subscription.id,
    paymentId: payment.id,
    invoiceNumber: invoice.invoiceNumber,
  };
}

/**
 * Handles 'subscription.pending' webhook event.
 * Activates 7-day grace period on renewal debit failure.
 * Ongoing live/scheduled elections continue running to protect voting integrity.
 *
 * @param {Object} payload
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Object>}
 */
export async function handleSubscriptionPending(payload, transaction = null) {
  const subEntity = payload?.subscription?.entity || {};
  const payEntity = payload?.payment?.entity || {};
  const subId = subEntity.id;

  if (!subId) return { skipped: true };

  const subscription = await OrganizationSubscription.findOne({
    where: { razorpaySubscriptionId: subId },
    include: [
      { model: SubscriptionPlan, as: 'plan' },
      {
        model: Organization,
        as: 'organization',
        include: [{ model: User, as: 'owner', attributes: ['email', 'name'] }],
      },
    ],
    transaction,
  });

  if (!subscription) return { skipped: true };

  // Set 7-day grace period
  const graceEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  subscription.status = 'pending';
  subscription.gracePeriodEnd = graceEnd;
  await subscription.save({ transaction });

  // Record failed transaction attempt
  if (payEntity.id) {
    try {
      await Payment.create(
        {
          orgId: subscription.orgId,
          userId: subscription.organization?.ownerId || null,
          subscriptionId: subscription.id,
          razorpayPaymentId: payEntity.id,
          razorpaySubscriptionId: subId,
          amount: payEntity.amount || 0,
          currency: payEntity.currency || 'INR',
          status: 'failed',
          paymentMethod: payEntity.method || 'card',
          paymentType: 'subscription',
          metadata: { failureReason: payEntity.error_description || 'Renewal debit declined' },
        },
        { transaction }
      );
    } catch {
      // Ignore conflict
    }
  }

  // Dispatch grace period warning email
  const recipientEmail = subscription.organization?.owner?.email;
  if (recipientEmail) {
    sendPaymentFailedGracePeriodEmail({
      to: recipientEmail,
      orgName: subscription.organization?.name,
      planName: subscription.plan?.name,
      gracePeriodEnd: graceEnd,
    }).catch(() => {});
  }

  return { handled: true, status: 'pending', gracePeriodEnd: graceEnd };
}

/**
 * Handles 'subscription.halted' webhook event.
 * Transitions subscription to halted when all renewal retries are exhausted.
 * Past elections and results remain permanently accessible.
 *
 * @param {Object} payload
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Object>}
 */
export async function handleSubscriptionHalted(payload, transaction = null) {
  const subEntity = payload?.subscription?.entity || {};
  const subId = subEntity.id;
  if (!subId) return { skipped: true };

  const subscription = await OrganizationSubscription.findOne({
    where: { razorpaySubscriptionId: subId },
    transaction,
  });

  if (!subscription) return { skipped: true };

  subscription.status = 'halted';
  await subscription.save({ transaction });

  return { handled: true, status: 'halted' };
}

/**
 * Handles 'subscription.cancelled' webhook event.
 *
 * @param {Object} payload
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Object>}
 */
export async function handleSubscriptionCancelled(payload, transaction = null) {
  const subEntity = payload?.subscription?.entity || {};
  const subId = subEntity.id;
  if (!subId) return { skipped: true };

  const subscription = await OrganizationSubscription.findOne({
    where: { razorpaySubscriptionId: subId },
    include: [
      { model: SubscriptionPlan, as: 'plan' },
      {
        model: Organization,
        as: 'organization',
        include: [{ model: User, as: 'owner', attributes: ['email', 'name'] }],
      },
    ],
    transaction,
  });

  if (!subscription) return { skipped: true };

  subscription.status = 'cancelled';
  subscription.cancellationDate = new Date();
  await subscription.save({ transaction });

  const recipientEmail = subscription.organization?.owner?.email;
  if (recipientEmail) {
    sendSubscriptionCancelledEmail({
      to: recipientEmail,
      orgName: subscription.organization?.name,
      planName: subscription.plan?.name,
      effectiveUntil: subscription.currentPeriodEnd || new Date(),
    }).catch(() => {});
  }

  return { handled: true, status: 'cancelled' };
}

/**
 * Handles 'order.paid' webhook event.
 * Fulfills one-time purchases: 30-Day Event Passes or Voter Capacity Boosters.
 *
 * @param {Object} payload
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Object>}
 */
export async function handleOrderPaid(payload, transaction = null) {
  const orderEntity = payload?.order?.entity || {};
  const payEntity = payload?.payment?.entity || {};

  const orderId = orderEntity.id;
  const paymentId = payEntity.id;
  const amount = payEntity.amount || orderEntity.amount || 0;
  const currency = payEntity.currency || 'INR';

  const notes = orderEntity.notes || {};
  const orderType = notes.order_type || notes.orderType || 'event_pass';
  const orgId = notes.organization_id || notes.orgId;
  const electionId = notes.election_id || notes.electionId;
  const boosterCount = Number(notes.voter_allowance || notes.voterAllowance || 0);

  if (!orgId) {
    return { skipped: true, reason: 'Missing organization ID in order notes' };
  }

  // 1. Insert Payment record
  const [payment] = await Payment.findOrCreate({
    where: { razorpayPaymentId: paymentId || `pay_ord_${Date.now()}` },
    defaults: {
      orgId,
      electionId: electionId || null,
      razorpayPaymentId: paymentId || `pay_ord_${Date.now()}`,
      razorpayOrderId: orderId,
      amount,
      currency,
      status: 'captured',
      paymentMethod: payEntity.method || 'card',
      paymentType: orderType === 'booster' ? 'booster' : 'one_time',
      metadata: { notes, rawOrder: orderEntity },
    },
    transaction,
  });

  // 2. Generate Invoice
  const totalAmount = amount;
  const taxAmount = Math.round((totalAmount * 18) / 118);
  const subtotal = totalAmount - taxAmount;
  const invoiceNumber = await generateSequentialInvoiceNumber(transaction);

  await Invoice.create(
    {
      orgId,
      paymentId: payment.id,
      invoiceNumber,
      subtotal,
      taxAmount,
      totalAmount,
      currency,
      status: 'paid',
      billingDetails: {
        sacCode: '998313',
        gstRate: '18%',
        orderType,
        orderId,
      },
      issuedAt: new Date(),
      paidAt: new Date(),
    },
    { transaction }
  );

  // 3. Fulfill credits based on order type
  if (orderType === 'event_pass') {
    // 30-Day Event Pass
    const eventPassPlan = await SubscriptionPlan.findOne({
      where: { slug: 'event-pass' },
      transaction,
    });

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await OrganizationSubscription.create(
      {
        orgId,
        planId: eventPassPlan ? eventPassPlan.id : null,
        status: 'active',
        billingInterval: 'once',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      { transaction }
    );
  } else if (orderType === 'booster' && electionId && boosterCount > 0) {
    // Increment election voter capacity
    const election = await Election.findByPk(electionId, { transaction });
    if (election) {
      const currentConfig = election.config || {};
      const currentBoosters = Number(currentConfig.additionalVoters || 0);
      election.config = {
        ...currentConfig,
        additionalVoters: currentBoosters + boosterCount,
      };
      await election.save({ transaction });
    }
  }

  return {
    handled: true,
    orderType,
    orderId,
    paymentId: payment.id,
  };
}

/**
 * Handles 'refund.processed' / 'refund.created' webhook events.
 * Updates payment status to refunded and voids/marks associated invoice,
 * while strictly adhering to democratic constitutional boundaries:
 * past elections, voter eligibility, and cast ballots remain permanently intact.
 *
 * @param {Object} payload
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Object>}
 */
export async function handleRefundProcessed(payload, transaction = null) {
  const refundEntity = payload?.refund?.entity || {};
  const paymentEntity = payload?.payment?.entity || {};

  const paymentId = refundEntity.payment_id || paymentEntity.id;
  const refundId = refundEntity.id || `rfnd_${Date.now()}`;
  const refundAmount = refundEntity.amount || paymentEntity.amount_refunded || 0;

  if (!paymentId) {
    return { skipped: true, reason: 'Missing payment ID in refund payload' };
  }

  const payment = await Payment.findOne({
    where: { razorpayPaymentId: paymentId },
    transaction,
  });

  if (!payment) {
    return { skipped: true, reason: `Payment ${paymentId} not found in database` };
  }

  payment.status = 'refunded';
  payment.metadata = {
    ...(payment.metadata || {}),
    refund: {
      refundId,
      amount: refundAmount,
      status: refundEntity.status || 'processed',
      notes: refundEntity.notes || {},
      processedAt: new Date(),
    },
  };
  await payment.save({ transaction });

  // Update associated invoice status to void/refunded if exists
  const invoice = await Invoice.findOne({
    where: { paymentId: payment.id },
    transaction,
  });

  if (invoice) {
    invoice.status = 'void';
    invoice.metadata = {
      ...(invoice.metadata || {}),
      voidReason: 'Payment refunded via Razorpay',
      refundId,
      refundedAt: new Date(),
    };
    await invoice.save({ transaction });
  }

  return {
    handled: true,
    status: 'refunded',
    paymentId: payment.id,
    refundId,
    amount: refundAmount,
  };
}

/**
 * Master dispatcher processing verified Razorpay webhook events inside a database transaction.
 *
 * @param {Object} params
 * @param {string} params.eventId
 * @param {string} params.eventType
 * @param {Object} params.payload
 * @returns {Promise<Object>}
 */
export async function processWebhookEvent({ eventId, eventType, payload }) {
  return await sequelize.transaction(async (t) => {
    switch (eventType) {
      case 'subscription.charged':
        return await handleSubscriptionCharged(payload, t);

      case 'subscription.pending':
        return await handleSubscriptionPending(payload, t);

      case 'subscription.halted':
        return await handleSubscriptionHalted(payload, t);

      case 'subscription.cancelled':
        return await handleSubscriptionCancelled(payload, t);

      case 'order.paid':
        return await handleOrderPaid(payload, t);

      case 'refund.processed':
      case 'refund.created':
        return await handleRefundProcessed(payload, t);

      default:
        return { handled: false, message: `Event type ${eventType} not subscribed` };
    }
  });
}

