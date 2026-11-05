import { Op } from 'sequelize';
import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireViewBillingAccess, canManageBilling } from '@/lib/auth/authorization';
import { getEffectiveOrgSubscription } from '@/lib/billing/entitlements';
import { formatPriceInr } from '@/lib/billing/plans-config';
import { getSubscriptionStatusBadge } from '@/lib/billing/subscription-lifecycle';
import { Election, Organization } from '@/models/index.js';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  UnauthorizedError,
  NotFoundError,
} from '@/lib/utils/error-handler';

/**
 * GET /api/orgs/[orgId]/billing
 * Returns current subscription details, commercial plan tier, usage telemetry meters,
 * renewal date, and RBAC billing management capabilities.
 */
export async function GET(request, { params }) {
  try {
    const { orgId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    // RBAC: Owners and Admins can view billing telemetry
    await requireViewBillingAccess(dbUser.id, orgId);

    const organization = await Organization.findByPk(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // 1. Resolve Effective Active Subscription & Plan
    const {
      subscription,
      plan,
      isGracePeriod,
      gracePeriodEnd,
    } = await getEffectiveOrgSubscription(orgId);

    // 2. Compute Current Month Election Usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyElectionsUsed = await Election.count({
      where: {
        orgId,
        createdAt: { [Op.gte]: startOfMonth },
      },
    });

    // 3. Compute Current Live / Scheduled Elections
    const liveElectionsUsed = await Election.count({
      where: {
        orgId,
        status: { [Op.in]: ['live', 'scheduled'] },
      },
    });

    // 4. Check if current user is owner (can manage subscriptions & payment methods)
    const canManage = await canManageBilling(dbUser.id, orgId);

    const statusBadge = getSubscriptionStatusBadge(
      subscription?.status || 'active',
      gracePeriodEnd
    );

    return successResponse(
      {
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        plan: {
          id: plan?.id || 'free',
          slug: plan?.slug || 'free',
          name: plan?.name || 'Free Plan',
          planType: plan?.planType || 'free',
          billingInterval: plan?.billingInterval || 'monthly',
          price: plan?.price || 0,
          formattedPrice: formatPriceInr(plan?.price || 0),
          features: plan?.features || {},
        },
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              gracePeriodEnd: subscription.gracePeriodEnd,
              cancellationDate: subscription.cancellationDate,
              billingInterval: subscription.billingInterval,
            }
          : null,
        statusBadge,
        isGracePeriod,
        gracePeriodEnd,
        canManageBilling: canManage,
        usage: {
          monthlyElections: {
            used: monthlyElectionsUsed,
            limit: plan?.monthlyElectionAllowance ?? 2,
            percentage: Math.min(
              100,
              Math.round((monthlyElectionsUsed / (plan?.monthlyElectionAllowance || 1)) * 100)
            ),
          },
          simultaneousLive: {
            used: liveElectionsUsed,
            limit: plan?.simultaneousLiveElections ?? 1,
            percentage: Math.min(
              100,
              Math.round((liveElectionsUsed / (plan?.simultaneousLiveElections || 1)) * 100)
            ),
          },
          voterLimitPerElection: plan?.voterLimitPerElection ?? 50,
        },
      },
      'Billing telemetry retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

