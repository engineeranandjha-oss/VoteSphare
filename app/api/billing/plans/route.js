import { successResponse } from '@/lib/utils/response';
import { handleApiError } from '@/lib/utils/error-handler';
import { SubscriptionPlan } from '@/models/index.js';
import {
  getAllActivePlans,
  VOTER_BOOSTER_PACKS,
  formatPriceInr,
} from '@/lib/billing/plans-config.js';

/**
 * GET /api/billing/plans
 * Public endpoint returning the active commercial plan catalog, pricing, and booster packs.
 */
export async function GET() {
  try {
    let plans = [];

    // Attempt to fetch persisted plans from database
    try {
      const dbPlans = await SubscriptionPlan.findAll({
        where: { isActive: true },
        order: [['sortOrder', 'ASC']],
      });

      if (dbPlans && dbPlans.length > 0) {
        plans = dbPlans.map((p) => {
          const plain = p.get({ plain: true });
          return {
            ...plain,
            formattedPrice: formatPriceInr(plain.price),
          };
        });
      }
    } catch {
      // Fallback if database is unavailable
      plans = [];
    }

    // If database returned no plans (e.g. before initial migration/seed), use canonical static config
    if (plans.length === 0) {
      plans = getAllActivePlans().map((p) => ({
        ...p,
        formattedPrice: formatPriceInr(p.price),
      }));
    }

    const boosters = Object.values(VOTER_BOOSTER_PACKS).map((b) => ({
      ...b,
      formattedPrice: formatPriceInr(b.price),
    }));

    return successResponse(
      {
        plans,
        boosters,
        currency: 'INR',
        currencySymbol: '₹',
        billingIntervals: ['monthly', 'annual', 'once'],
      },
      'Active plan catalog retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

