import { Op } from 'sequelize';
import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireBillingAccess } from '@/lib/auth/authorization';
import { subscriptionCancelSchema } from '@/lib/validations';
import { cancelRazorpaySubscription } from '@/lib/billing/razorpay';
import { OrganizationSubscription, AuditLog } from '@/models/index.js';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  UnauthorizedError,
  NotFoundError,
} from '@/lib/utils/error-handler';

/**
 * POST /api/billing/subscriptions/cancel
 * Cancels an active recurring subscription via Razorpay API.
 * Follows commercial best practice: access is preserved until the end of the current billing cycle.
 * Restricted strictly to Organization Owners.
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
    const validatedData = subscriptionCancelSchema.parse(body);
    const { orgId, reason = null, cancelAtCycleEnd = true } = validatedData;

    // Strict Billing RBAC check: only Owner can cancel
    await requireBillingAccess(dbUser.id, orgId);

    // 1. Locate active or pending subscription
    const subscription = await OrganizationSubscription.findOne({
      where: {
        orgId,
        status: { [Op.in]: ['active', 'trialing', 'pending', 'authenticated'] },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!subscription) {
      throw new NotFoundError('No active recurring subscription found for this organization');
    }

    // 2. Call Razorpay Subscriptions Cancel API
    if (subscription.razorpaySubscriptionId) {
      try {
        await cancelRazorpaySubscription(
          subscription.razorpaySubscriptionId,
          cancelAtCycleEnd
        );
      } catch (err) {
        // Continue if already cancelled on gateway
      }
    }

    // 3. Update local database record
    subscription.cancellationDate = new Date();

    if (!cancelAtCycleEnd) {
      subscription.status = 'cancelled';
    }

    await subscription.save();

    // 4. Audit logging
    try {
      await AuditLog.create({
        orgId,
        userId: dbUser.id,
        action: 'SUBSCRIPTION_CANCELLED',
        entityType: 'subscription',
        entityId: subscription.id,
        metadata: {
          reason,
          cancelAtCycleEnd,
          effectiveDate: cancelAtCycleEnd ? subscription.currentPeriodEnd : new Date(),
        },
      });
    } catch {
      // Ignore audit log write failure
    }

    return successResponse(
      {
        cancelled: true,
        cancelAtCycleEnd,
        effectiveUntil: subscription.currentPeriodEnd || new Date(),
        message: cancelAtCycleEnd
          ? 'Your subscription has been scheduled for cancellation at the end of the current billing cycle. You retain full access until then.'
          : 'Your subscription has been cancelled immediately.',
      },
      'Subscription cancelled successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

