import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requirePlatformAdmin } from '@/lib/auth/authorization';
import {
  sequelize,
  Payment,
  OrganizationSubscription,
  SubscriptionPlan,
  Organization,
} from '@/models/index.js';
import { Op } from 'sequelize';
import { PLANS_CONFIG, formatPriceInr } from '@/lib/billing/plans-config';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError } from '@/lib/utils/error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/billing/metrics
 * Superadmin API aggregating platform financial KPIs:
 * - Gross Merchandise Value (GMV) / Total Revenue
 * - Monthly Recurring Revenue (MRR)
 * - Annual Recurring Revenue (ARR)
 * - Active Subscriptions & Paying Customer Conversion
 * - Plan Breakdown & Churn/Overdue Telemetry
 */
export async function GET() {
  try {
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    // Require platform administrator privileges
    requirePlatformAdmin(dbUser);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Total Gross Revenue (Captured Payments)
    const grossPayments = await Payment.findAll({
      attributes: [
        'status',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
      ],
      group: ['status'],
      raw: true,
    });

    let totalGrossRevenuePaise = 0;
    let totalRefundedPaise = 0;
    let successfulTransactionCount = 0;
    let failedTransactionCount = 0;

    for (const row of grossPayments) {
      const amt = Number(row.totalAmount || 0);
      const count = Number(row.transactionCount || 0);

      if (row.status === 'captured') {
        totalGrossRevenuePaise += amt;
        successfulTransactionCount += count;
      } else if (row.status === 'refunded') {
        totalRefundedPaise += amt;
      } else if (row.status === 'failed') {
        failedTransactionCount += count;
      }
    }

    const netRevenuePaise = Math.max(0, totalGrossRevenuePaise - totalRefundedPaise);

    // 2. 30-Day Revenue
    const recentPayments = await Payment.findAll({
      where: {
        status: 'captured',
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'recentAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'recentCount'],
      ],
      raw: true,
    });

    const recent30DaysPaise = Number(recentPayments[0]?.recentAmount || 0);
    const recent30DaysCount = Number(recentPayments[0]?.recentCount || 0);

    // 3. Active Subscriptions & MRR Computation
    const activeSubs = await OrganizationSubscription.findAll({
      where: {
        status: { [Op.in]: ['active', 'trialing', 'pending'] },
      },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['id', 'slug', 'name', 'price', 'billingInterval'],
        },
      ],
    });

    let mrrPaise = 0;
    let activeSubscriptionsCount = 0;
    let pendingGracePeriodCount = 0;
    const planCounts = {
      free: 0,
      'event-pass': 0,
      'starter-monthly': 0,
      'starter-annual': 0,
      'pro-monthly': 0,
      'pro-annual': 0,
      enterprise: 0,
    };

    for (const sub of activeSubs) {
      const slug = sub.plan?.slug || 'free';
      planCounts[slug] = (planCounts[slug] || 0) + 1;

      if (sub.status === 'active' || sub.status === 'trialing') {
        activeSubscriptionsCount++;
        const planPrice = sub.plan?.price || PLANS_CONFIG[slug]?.price || 0;
        const interval = sub.billingInterval || sub.plan?.billingInterval || 'monthly';

        if (interval === 'monthly') {
          mrrPaise += planPrice;
        } else if (interval === 'yearly') {
          mrrPaise += Math.round(planPrice / 12);
        }
      } else if (sub.status === 'pending') {
        pendingGracePeriodCount++;
      }
    }

    const arrPaise = mrrPaise * 12;

    // 4. Organization Conversion Rate
    const totalOrganizations = await Organization.count();
    const paidOrgsCount = await Payment.count({
      where: { status: 'captured' },
      distinct: true,
      col: 'orgId',
    });

    const conversionRate = totalOrganizations > 0
      ? Number(((paidOrgsCount / totalOrganizations) * 100).toFixed(1))
      : 0;

    return successResponse(
      {
        kpis: {
          totalGrossRevenuePaise,
          totalGrossRevenueFormatted: formatPriceInr(totalGrossRevenuePaise),
          totalRefundedPaise,
          totalRefundedFormatted: formatPriceInr(totalRefundedPaise),
          netRevenuePaise,
          netRevenueFormatted: formatPriceInr(netRevenuePaise),
          mrrPaise,
          mrrFormatted: formatPriceInr(mrrPaise),
          arrPaise,
          arrFormatted: formatPriceInr(arrPaise),
          recent30DaysPaise,
          recent30DaysFormatted: formatPriceInr(recent30DaysPaise),
          recent30DaysCount,
          activeSubscriptionsCount,
          pendingGracePeriodCount,
          successfulTransactionCount,
          failedTransactionCount,
          totalOrganizations,
          paidOrgsCount,
          conversionRate,
        },
        planDistribution: planCounts,
      },
      'Admin financial metrics retrieved successfully'
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Admin Metrics API Error]:', error);
    return handleApiError(error);
  }
}

