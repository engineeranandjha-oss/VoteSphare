import { Op } from 'sequelize';
import {
  OrganizationSubscription,
  SubscriptionPlan,
  Election,
  Eligibility,
  UsageRecord,
} from '../../models/index.js';
import { PLANS_CONFIG } from './plans-config.js';
import { isSubscriptionOperational } from './subscription-lifecycle.js';
import { PaymentRequiredError } from '../utils/error-handler.js';

/**
 * Determine a recommended upgrade plan slug based on current tier.
 */
function getSuggestedUpgrade(currentSlug = 'free') {
  switch (currentSlug) {
    case 'free':
      return 'starter-monthly';
    case 'starter-monthly':
    case 'starter-annual':
      return 'pro-monthly';
    case 'event-pass':
      return 'pro-monthly';
    case 'pro-monthly':
    case 'pro-annual':
      return 'enterprise';
    default:
      return 'enterprise';
  }
}

/**
 * Retrieves the effective active subscription and plan for an organization.
 * Automatically evaluates trial, active, grace period, and fallback to Free tier.
 *
 * @param {string} orgId - Organization UUID
 * @returns {Promise<{
 *   subscription: import('@/models/organizationsubscription.js').OrganizationSubscription | null,
 *   plan: import('@/models/subscriptionplan.js').SubscriptionPlan | typeof PLANS_CONFIG.free,
 *   isGracePeriod: boolean,
 *   gracePeriodEnd: Date | null
 * }>}
 */
export async function getEffectiveOrgSubscription(orgId) {
  if (!orgId) {
    return {
      subscription: null,
      plan: PLANS_CONFIG.free,
      isGracePeriod: false,
      gracePeriodEnd: null,
    };
  }

  try {
    const activeSub = await OrganizationSubscription.findOne({
      where: {
        orgId,
        status: { [Op.in]: ['active', 'trialing', 'pending'] },
      },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (activeSub && activeSub.plan) {
      const operational = isSubscriptionOperational(activeSub.status, activeSub.gracePeriodEnd);

      if (operational) {
        const isGrace = activeSub.status === 'pending';
        return {
          subscription: activeSub,
          plan: activeSub.plan,
          isGracePeriod: isGrace,
          gracePeriodEnd: isGrace ? activeSub.gracePeriodEnd : null,
        };
      }
    }

    // Grace period expired, subscription halted, or no subscription: fall back to Free plan
    let freePlanRecord = await SubscriptionPlan.findOne({ where: { slug: 'free' } });
    if (!freePlanRecord) {
      freePlanRecord = PLANS_CONFIG.free;
    }

    return {
      subscription: null,
      plan: freePlanRecord,
      isGracePeriod: false,
      gracePeriodEnd: null,
    };
  } catch {
    // If DB error or during migration before tables exist, safely fall back to static Free plan
    return {
      subscription: null,
      plan: PLANS_CONFIG.free,
      isGracePeriod: false,
      gracePeriodEnd: null,
    };
  }
}

/**
 * Asserts whether an organization can create a new election in the current calendar month.
 * Throws PaymentRequiredError (402) if monthly election allowance is reached.
 *
 * @param {string} orgId - Organization UUID
 * @throws {PaymentRequiredError}
 * @returns {Promise<{ allowed: boolean, currentCount: number, limit: number }>}
 */
export async function assertCanCreateElection(orgId) {
  const { plan } = await getEffectiveOrgSubscription(orgId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyCount = await Election.count({
    where: {
      orgId,
      createdAt: { [Op.gte]: startOfMonth },
    },
  });

  const allowance = plan.monthlyElectionAllowance ?? 2;

  if (monthlyCount >= allowance) {
    throw new PaymentRequiredError(
      `Your organization has reached its monthly limit of ${allowance} election(s) on the ${plan.name} plan. Please upgrade to create more elections this month.`,
      {
        limit: allowance,
        current: monthlyCount,
        resource: 'monthly_elections',
        upgradePlan: getSuggestedUpgrade(plan.slug),
      }
    );
  }

  return {
    allowed: true,
    currentCount: monthlyCount,
    limit: allowance,
  };
}

/**
 * Computes the effective voter capacity for a specific election,
 * taking into account base plan limit and any booster packs added to election.config.
 *
 * @param {object} plan - SubscriptionPlan or static plan config
 * @param {object} [election] - Election model or object
 * @returns {number}
 */
export function getEffectiveVoterCapacity(plan, election = null) {
  const baseLimit = plan?.voterLimitPerElection ?? 50;
  const boosterAdditional = election?.config?.additionalVoters ?? 0;
  return baseLimit + Number(boosterAdditional);
}

/**
 * Asserts whether an election can accept an additional batch of eligible voters.
 * Throws PaymentRequiredError (402) if enrolled voters + new batch exceeds voter capacity.
 *
 * @param {string} orgId - Organization UUID
 * @param {string} electionId - Election UUID
 * @param {number} [newVoterCount=1] - Number of voters attempting to be enrolled
 * @throws {PaymentRequiredError}
 * @returns {Promise<{ allowed: boolean, currentCount: number, effectiveLimit: number }>}
 */
export async function assertCanEnrollVoters(orgId, electionId, newVoterCount = 1) {
  const { plan } = await getEffectiveOrgSubscription(orgId);

  const election = await Election.findByPk(electionId, {
    attributes: ['id', 'config'],
  });

  const effectiveLimit = getEffectiveVoterCapacity(plan, election);

  const currentCount = await Eligibility.count({
    where: { electionId },
  });

  if (currentCount + newVoterCount > effectiveLimit) {
    const excess = currentCount + newVoterCount - effectiveLimit;
    let suggestedBooster = 'booster-250';
    if (excess > 500) {
      suggestedBooster = 'booster-1500';
    } else if (excess > 250) {
      suggestedBooster = 'booster-500';
    }

    throw new PaymentRequiredError(
      `Enrolling ${newVoterCount} voter(s) would exceed the limit of ${effectiveLimit} eligible voters for this election on the ${plan.name} plan (Current enrolled: ${currentCount}). Please purchase a voter capacity booster or upgrade your plan.`,
      {
        limit: effectiveLimit,
        current: currentCount,
        attempted: newVoterCount,
        excess,
        suggestedBooster,
        resource: 'voters',
        upgradePlan: getSuggestedUpgrade(plan.slug),
      }
    );
  }

  return {
    allowed: true,
    currentCount,
    effectiveLimit,
  };
}

/**
 * Asserts whether an election can be transitioned to 'scheduled' or 'live'.
 * Validates concurrent live election limits and verifies voter count does not exceed capacity.
 *
 * @param {string} orgId - Organization UUID
 * @param {string} electionId - Election UUID
 * @throws {PaymentRequiredError}
 * @returns {Promise<{ allowed: boolean }>}
 */
export async function assertCanLaunchElection(orgId, electionId) {
  const { plan } = await getEffectiveOrgSubscription(orgId);

  // 1. Check concurrent live / scheduled election limit
  const simultaneousLimit = plan.simultaneousLiveElections ?? 1;

  const liveCount = await Election.count({
    where: {
      orgId,
      status: { [Op.in]: ['live', 'scheduled'] },
      id: { [Op.ne]: electionId },
    },
  });

  if (liveCount >= simultaneousLimit) {
    throw new PaymentRequiredError(
      `Your organization currently has ${liveCount} active/scheduled election(s). The ${plan.name} plan allows a maximum of ${simultaneousLimit} simultaneous active election(s). Please end an active election or upgrade your plan to launch more.`,
      {
        limit: simultaneousLimit,
        current: liveCount,
        resource: 'simultaneous_live',
        upgradePlan: getSuggestedUpgrade(plan.slug),
      }
    );
  }

  // 2. Verify total enrolled voters against capacity
  const election = await Election.findByPk(electionId, {
    attributes: ['id', 'config'],
  });
  const effectiveLimit = getEffectiveVoterCapacity(plan, election);

  const totalEnrolled = await Eligibility.count({
    where: { electionId },
  });

  if (totalEnrolled > effectiveLimit) {
    throw new PaymentRequiredError(
      `Cannot launch election: Total enrolled voters (${totalEnrolled}) exceeds the allowed limit of ${effectiveLimit} for this election on your current plan. Please upgrade or purchase a voter booster.`,
      {
        limit: effectiveLimit,
        current: totalEnrolled,
        resource: 'voters',
        upgradePlan: getSuggestedUpgrade(plan.slug),
      }
    );
  }

  return { allowed: true };
}

/**
 * Asserts whether an organization has access to the automated runoff election engine.
 *
 * @param {string} orgId - Organization UUID
 * @throws {PaymentRequiredError}
 * @returns {Promise<{ allowed: boolean }>}
 */
export async function assertCanRunoff(orgId) {
  const { plan } = await getEffectiveOrgSubscription(orgId);

  if (!plan.features?.runoff) {
    throw new PaymentRequiredError(
      `Automated runoff elections are an advanced governance feature available on Professional, Enterprise, and Event Pass plans. Please upgrade to launch runoff elections.`,
      {
        feature: 'runoff',
        resource: 'advanced_feature',
        upgradePlan: 'pro-monthly',
      }
    );
  }

  return { allowed: true };
}

/**
 * Asserts whether an organization has access to a specific boolean feature flag.
 *
 * @param {string} orgId - Organization UUID
 * @param {string} featureName - Feature key in plan.features
 * @returns {Promise<boolean>}
 */
export async function hasFeature(orgId, featureName) {
  if (!orgId || !featureName) return false;
  const { plan } = await getEffectiveOrgSubscription(orgId);
  return Boolean(plan?.features?.[featureName]);
}

/**
 * Checks whether an organization has custom branding / watermark suppression entitlement.
 *
 * @param {string} orgId - Organization UUID
 * @returns {Promise<boolean>}
 */
export async function canUseCustomBranding(orgId) {
  return await hasFeature(orgId, 'customBranding');
}

/**
 * Records granular resource consumption in the usage_records table.
 * Operates gracefully and does not throw if database logging encounters an error.
 *
 * @param {Object} params
 * @param {string} params.orgId
 * @param {'election_created' | 'voter_enrolled' | 'email_dispatched'} params.usageType
 * @param {number} [params.quantity=1]
 * @param {string} [params.electionId]
 * @param {string} [params.subscriptionId]
 */
export async function recordUsage({
  orgId,
  usageType,
  quantity = 1,
  electionId = null,
  subscriptionId = null,
}) {
  try {
    const now = new Date();
    const billingPeriodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await UsageRecord.create({
      orgId,
      subscriptionId,
      electionId,
      usageType,
      quantity,
      billingPeriodMonth,
      recordedAt: now,
    });
  } catch {
    // Usage record logging is append-only telemetry; fail silently to avoid interrupting operations
  }
}
