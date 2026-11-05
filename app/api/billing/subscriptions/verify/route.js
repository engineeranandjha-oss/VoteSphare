import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireBillingAccess } from '@/lib/auth/authorization';
import { subscriptionVerifySchema } from '@/lib/validations';
import { verifyPaymentSignature } from '@/lib/billing/razorpay';
import {
  OrganizationSubscription,
  Payment,
  SubscriptionPlan,
} from '@/models/index.js';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  ValidationError,
  UnauthorizedError,
} from '@/lib/utils/error-handler';

/**
 * POST /api/billing/subscriptions/verify
 * Validates HMAC-SHA256 signature returned by Razorpay Checkout after initial AFA e-mandate.
 * Updates local subscription state to 'authenticated' pending webhook confirmation.
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
    const validatedData = subscriptionVerifySchema.parse(body);

    const {
      orgId,
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = validatedData;

    // Strict Billing RBAC check
    await requireBillingAccess(dbUser.id, orgId);

    // 1. Verify HMAC-SHA256 Signature using timing-safe comparison
    const isValid = verifyPaymentSignature({
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      throw new ValidationError(
        'Payment signature verification failed. Tampered or invalid credentials.'
      );
    }

    // 2. Find and update local OrganizationSubscription record
    let sub = await OrganizationSubscription.findOne({
      where: {
        orgId,
        razorpaySubscriptionId: razorpay_subscription_id,
      },
      include: [{ model: SubscriptionPlan, as: 'plan' }],
    });

    if (sub) {
      const isMock = razorpay_subscription_id?.startsWith('sub_mock_') || process.env.RAZORPAY_MOCK === 'true';
      if (isMock) {
        sub.status = 'active';
        sub.currentPeriodStart = new Date();
        const durationDays = sub.billingInterval === 'yearly' ? 365 : 30;
        sub.currentPeriodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      } else if (sub.status === 'created' || sub.status === 'pending') {
        sub.status = 'active';
      }
      await sub.save();
    }

    // 3. Record payment transaction
    try {
      await Payment.findOrCreate({
        where: { razorpayPaymentId: razorpay_payment_id },
        defaults: {
          orgId,
          userId: dbUser.id,
          subscriptionId: sub ? sub.id : null,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySubscriptionId: razorpay_subscription_id,
          amount: sub?.plan?.price || 0,
          currency: 'INR',
          status: 'authorized',
          paymentType: 'subscription',
        },
      });
    } catch {
      // Payment table insert may be completed by webhook; ignore conflict
    }

    return successResponse(
      {
        verified: true,
        subscriptionId: razorpay_subscription_id,
        status: sub ? sub.status : 'authenticated',
        message: 'Payment authentication verified successfully',
      },
      'Subscription authentication verified'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

