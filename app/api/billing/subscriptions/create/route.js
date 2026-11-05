import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireBillingAccess } from '@/lib/auth/authorization';
import { subscriptionCreateSchema } from '@/lib/validations';
import { createRazorpaySubscription } from '@/lib/billing/razorpay';
import {
  SubscriptionPlan,
  OrganizationSubscription,
  Organization,
} from '@/models/index.js';
import { getPlanBySlug } from '@/lib/billing/plans-config';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '@/lib/utils/error-handler';
import { env } from '@/lib/env';

/**
 * POST /api/billing/subscriptions/create
 * Creates a recurring subscription session via Razorpay Subscriptions API.
 * Access restricted strictly to Organization Owners.
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
    const validatedData = subscriptionCreateSchema.parse(body);
    const { orgId, planSlug, customerNotify = 1 } = validatedData;

    // Strict Billing RBAC check: only organization Owner can manage billing
    await requireBillingAccess(dbUser.id, orgId);

    const organization = await Organization.findByPk(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // 1. Resolve plan details
    let plan = await SubscriptionPlan.findOne({ where: { slug: planSlug } });
    const staticPlan = getPlanBySlug(planSlug);

    if (!plan && !staticPlan) {
      throw new NotFoundError(`Subscription plan '${planSlug}' not found`);
    }

    const planType = plan?.planType || staticPlan?.planType;
    if (planType === 'one_time') {
      throw new ValidationError(
        `Plan '${planSlug}' is a one-time purchase. Please use the /api/billing/orders endpoint instead.`
      );
    }

    const planName = plan?.name || staticPlan?.name;
    const razorpayPlanId = plan?.razorpayPlanId || `plan_${planSlug.replace(/-/g, '_')}`;

    // 2. Call Razorpay Subscriptions API
    const rzpSub = await createRazorpaySubscription({
      planId: razorpayPlanId,
      totalCount: 120, // 10 years auto-renewing cycles
      customerNotify,
      notes: {
        orgId,
        orgName: organization.name,
        planSlug,
        userId: dbUser.id,
        userEmail: dbUser.email,
      },
    });

    // 3. Pre-register subscription record in local database with 'created' status
    let localSub = null;
    try {
      localSub = await OrganizationSubscription.create({
        orgId,
        planId: plan ? plan.id : null,
        razorpaySubscriptionId: rzpSub.id,
        status: 'pending',
        billingInterval: plan?.billingInterval || staticPlan?.billingInterval || 'monthly',
      });
    } catch {
      // If table is being prepared or constraint conflict, proceed with checkout
    }

    const clientKeyId =
      env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      env.RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      'rzp_test_placeholder';

    return successResponse(
      {
        subscriptionId: rzpSub.id,
        keyId: clientKeyId,
        orgId,
        plan: {
          slug: planSlug,
          name: planName,
          price: plan?.price ?? staticPlan?.price,
          currency: 'INR',
        },
        localSubscriptionId: localSub ? localSub.id : null,
      },
      'Subscription initiated successfully',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

