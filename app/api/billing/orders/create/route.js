import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireBillingAccess } from '@/lib/auth/authorization';
import { orderCreateSchema } from '@/lib/validations';
import { createRazorpayOrder } from '@/lib/billing/razorpay';
import { getBoosterPackBySlug, PLANS_CONFIG } from '@/lib/billing/plans-config';
import { Organization, Election, Payment } from '@/models/index.js';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '@/lib/utils/error-handler';
import { env } from '@/lib/env';

/**
 * POST /api/billing/orders/create
 * Creates a one-time order via Razorpay Orders API for:
 * 1. 30-Day Event Passes (single election AGM / RWA / Club pass)
 * 2. Voter Capacity Boosters (+250, +500, +1,500 voters)
 *
 * Strict RBAC: Restricted to Organization Owners or Billing Managers.
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
    const validatedData = orderCreateSchema.parse(body);
    const {
      orgId,
      orderType,
      boosterSlug,
      electionId,
      customerGstin,
      billingName,
      billingAddress,
    } = validatedData;

    // Strict Billing RBAC check
    await requireBillingAccess(dbUser.id, orgId);

    const organization = await Organization.findByPk(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    let amount = 0;
    let voterAllowance = 0;
    let itemDescription = '';

    if (orderType === 'voter_booster') {
      if (!electionId) {
        throw new ValidationError('electionId is required for voter capacity boosters');
      }

      const targetElection = await Election.findOne({
        where: { id: electionId, orgId },
      });

      if (!targetElection) {
        throw new NotFoundError('Target election not found in this organization');
      }

      const booster = getBoosterPackBySlug(boosterSlug);
      if (!booster) {
        throw new ValidationError(`Invalid booster slug: ${boosterSlug}`);
      }

      amount = booster.price;
      voterAllowance = booster.additionalVoters;
      itemDescription = booster.name;
    } else if (orderType === 'event_pass') {
      const eventPassPlan = PLANS_CONFIG['event-pass'];
      amount = eventPassPlan.price;
      voterAllowance = eventPassPlan.voterLimitPerElection;
      itemDescription = eventPassPlan.name;
    } else {
      throw new ValidationError(`Unsupported order type: ${orderType}`);
    }

    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Create Razorpay Order
    const rzpOrder = await createRazorpayOrder({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        orderType,
        orgId,
        electionId: electionId || '',
        boosterSlug: boosterSlug || '',
        voterAllowance: String(voterAllowance),
        customerGstin: customerGstin || '',
        billingName: billingName || organization.name,
        userId: dbUser.id,
      },
    });

    // Pre-register payment record with 'created' status
    let localPayment = null;
    try {
      localPayment = await Payment.create({
        orgId,
        userId: dbUser.id,
        electionId: electionId || null,
        razorpayOrderId: rzpOrder.id,
        amount,
        currency: 'INR',
        status: 'created',
        paymentType: orderType === 'voter_booster' ? 'booster' : 'one_time',
        metadata: {
          orderType,
          boosterSlug: boosterSlug || null,
          itemDescription,
          customerGstin: customerGstin || null,
          billingName: billingName || null,
          billingAddress: billingAddress || null,
        },
      });
    } catch {
      // Payment pre-registration is best-effort; order verify will guarantee record creation
    }

    const clientKeyId =
      env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      env.RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      'rzp_test_mock';

    return successResponse(
      {
        order: {
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          keyId: clientKeyId,
        },
        orderType,
        boosterSlug: boosterSlug || null,
        voterAllowance,
        itemDescription,
        paymentId: localPayment?.id || null,
      },
      'Order created successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

