import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireBillingAccess } from '@/lib/auth/authorization';
import { orderVerifySchema } from '@/lib/validations';
import { verifyPaymentSignature } from '@/lib/billing/razorpay';
import {
  sequelize,
  Payment,
  Invoice,
  Election,
  OrganizationSubscription,
  SubscriptionPlan,
} from '@/models/index.js';
import { generateSequentialInvoiceNumber } from '@/lib/billing/webhook-handlers';
import { getBoosterPackBySlug } from '@/lib/billing/plans-config';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  ValidationError,
  UnauthorizedError,
} from '@/lib/utils/error-handler';

/**
 * POST /api/billing/orders/verify
 * Validates HMAC-SHA256 signature from Razorpay Checkout for one-time orders
 * and atomically fulfills benefits (either 30-Day Event Pass or Voter Capacity Booster).
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    const body = await request.json();
    const validatedData = orderVerifySchema.parse(body);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orgId: reqOrgId,
      electionId: reqElectionId,
    } = validatedData;

    // 1. Verify HMAC-SHA256 signature using timing-safe comparison
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      throw new ValidationError(
        'Payment signature verification failed. Tampered or invalid credentials.'
      );
    }

    // 2. Process order fulfillment atomically inside a transaction
    const result = await sequelize.transaction(async (t) => {
      // Find or locate payment
      let payment = await Payment.findOne({
        where: { razorpayOrderId: razorpay_order_id },
        transaction: t,
      });

      // Idempotency check: if already captured, return immediately
      if (payment && payment.status === 'captured') {
        return {
          verified: true,
          alreadyProcessed: true,
          paymentId: payment.id,
          orderId: razorpay_order_id,
          message: 'Payment already verified and fulfilled',
        };
      }

      const orgId = payment?.orgId || reqOrgId;
      if (!orgId) {
        throw new ValidationError('Organization ID missing for payment fulfillment');
      }

      // Check user authorization to manage billing
      await requireBillingAccess(dbUser.id, orgId);

      const electionId = payment?.electionId || reqElectionId;

      if (!payment) {
        payment = await Payment.create(
          {
            orgId,
            userId: dbUser.id,
            electionId: electionId || null,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: 0,
            currency: 'INR',
            status: 'captured',
            paymentType: electionId ? 'booster' : 'one_time',
          },
          { transaction: t }
        );
      } else {
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.status = 'captured';
        await payment.save({ transaction: t });
      }

      // Generate GST Tax Invoice
      const existingInvoice = await Invoice.findOne({
        where: { paymentId: payment.id },
        transaction: t,
      });

      if (!existingInvoice) {
        const totalAmount = payment.amount || 0;
        const taxAmount = Math.round((totalAmount * 18) / 118);
        const subtotal = totalAmount - taxAmount;
        const invoiceNumber = await generateSequentialInvoiceNumber(t);

        await Invoice.create(
          {
            orgId,
            paymentId: payment.id,
            invoiceNumber,
            subtotal,
            taxAmount,
            totalAmount,
            currency: payment.currency || 'INR',
            status: 'paid',
            billingDetails: {
              sacCode: '998313',
              gstRate: '18%',
              orderId: razorpay_order_id,
              paymentId: razorpay_payment_id,
              customerGstin: payment.metadata?.customerGstin || null,
            },
            issuedAt: new Date(),
            paidAt: new Date(),
          },
          { transaction: t }
        );
      }

      // Fulfill benefits based on order type
      const isBooster =
        payment.paymentType === 'booster' ||
        payment.metadata?.orderType === 'voter_booster' ||
        Boolean(payment.metadata?.boosterSlug);

      if (isBooster && electionId) {
        const targetElection = await Election.findByPk(electionId, { transaction: t });
        if (targetElection) {
          const boosterSlug = payment.metadata?.boosterSlug;
          let additionalVoters = 0;

          if (boosterSlug) {
            const pack = getBoosterPackBySlug(boosterSlug);
            if (pack) additionalVoters = pack.additionalVoters;
          }

          if (additionalVoters === 0 && payment.metadata?.voterAllowance) {
            additionalVoters = Number(payment.metadata.voterAllowance);
          }

          if (additionalVoters > 0) {
            const currentConfig = targetElection.config || {};
            const existingBooster = Number(currentConfig.additionalVoters || 0);

            targetElection.config = {
              ...currentConfig,
              additionalVoters: existingBooster + additionalVoters,
            };
            await targetElection.save({ transaction: t });
          }
        }
      } else {
        // Event Pass fulfillment
        const eventPassPlan = await SubscriptionPlan.findOne({
          where: { slug: 'event-pass' },
          transaction: t,
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
          { transaction: t }
        );
      }

      return {
        verified: true,
        orderId: razorpay_order_id,
        paymentId: payment.id,
        status: 'captured',
        message: 'Payment verified and credits applied successfully',
      };
    });

    return successResponse(result, 'Payment verified successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

