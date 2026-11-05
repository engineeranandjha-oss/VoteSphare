export const dynamic = 'force-dynamic';

import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { getUserRole } from '@/lib/auth/authorization';
import { getEffectiveOrgSubscription } from '@/lib/billing/entitlements';
import { formatPriceInr } from '@/lib/billing/plans-config';
import { getSubscriptionStatusBadge } from '@/lib/billing/subscription-lifecycle';
import { Organization, Member, User, Election, Position, Eligibility, Vote } from '@/models/index.js';
import { Op } from 'sequelize';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/utils/error-handler';

/**
 * GET /api/orgs/dashboard
 * Retrieves the organization dashboard data for the authenticated user's active/selected organization.
 * Accepts optional query parameter ?orgId=<uuid-or-slug> to switch between organizations.
 * Returns a valid empty-state response when the user does not belong to any organization.
 */
export async function GET(request) {
  try {
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User profile synchronization failed');
    }

    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId')?.trim();

    // 1. Fetch all memberships and owned organizations for current user
    const memberships = await Member.findAll({
      where: {
        userId: dbUser.id,
        status: 'active',
      },
      attributes: ['orgId', 'role'],
    });

    const memberOrgIds = memberships.map((m) => m.orgId);
    const roleMap = new Map(memberships.map((m) => [m.orgId, m.role]));

    const userOrganizations = await Organization.findAll({
      where: {
        [Op.or]: [
          { ownerId: dbUser.id },
          { id: { [Op.in]: memberOrgIds } },
        ],
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'image'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Format all user orgs with role
    const formattedUserOrgs = userOrganizations.map((org) => {
      const role = org.ownerId === dbUser.id ? 'owner' : roleMap.get(org.id) || 'voter';
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        type: org.type,
        logo: org.logo,
        userRole: role,
        isOwner: org.ownerId === dbUser.id,
      };
    });

    // 2. Resolve target organization
    let targetOrg = null;

    if (orgIdParam && orgIdParam !== 'dashboard') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdParam);
      targetOrg = userOrganizations.find((o) =>
        isUUID ? o.id === orgIdParam : o.slug?.toLowerCase() === orgIdParam.toLowerCase()
      );

      // If not in user's organizations, check whether it exists in the system to return proper 403 vs 404
      if (!targetOrg) {
        const foreignOrg = await Organization.findOne({
          where: isUUID ? { id: orgIdParam } : { slug: orgIdParam.toLowerCase() },
          attributes: ['id'],
        });

        if (foreignOrg) {
          throw new ForbiddenError('You do not have permission to access this organization');
        } else {
          throw new NotFoundError('Organization not found');
        }
      }
    } else {
      // Empty-state handler: user has zero organizations and no specific org was requested
      if (formattedUserOrgs.length === 0) {
        return successResponse(
          {
            id: null,
            organization: null,
            organizations: [],
            userRole: null,
            isOwner: false,
            canManage: false,
            memberCount: 0,
            stats: {
              totalElections: 0,
              liveElections: 0,
              completedElections: 0,
              draftElections: 0,
              totalVotes: 0,
              eligibleVoters: 0,
              averageTurnout: 0,
            },
            subscription: null,
            plan: null,
          },
          'No organization workspaces associated with this account'
        );
      }

      // Default to first organization (or owned organization first)
      targetOrg = userOrganizations.find((o) => o.ownerId === dbUser.id) || userOrganizations[0];
    }

    // 4. Determine user role in target organization
    const userRole = targetOrg.ownerId === dbUser.id
      ? 'owner'
      : (await getUserRole(targetOrg.id, dbUser.id)) || 'voter';

    const isOwner = userRole === 'owner';
    const canManage = userRole === 'owner' || userRole === 'admin';

    // 5. Active member count
    const memberCount = await Member.count({
      where: { orgId: targetOrg.id, status: 'active' },
    });

    // 6. Aggregate Election Statistics
    const elections = await Election.findAll({
      where: { orgId: targetOrg.id },
      attributes: ['id', 'status', 'createdAt'],
      include: [
        {
          model: Position,
          as: 'positions',
          attributes: ['id'],
        },
        {
          model: Eligibility,
          as: 'eligibilities',
          attributes: ['id', 'status'],
        },
        {
          model: Vote,
          as: 'votes',
          attributes: ['id'],
        },
      ],
    });

    let liveElections = 0;
    let completedElections = 0;
    let draftElections = 0;
    let totalVotesSum = 0;
    let totalEligibleSum = 0;

    for (const e of elections) {
      if (e.status === 'live') liveElections++;
      else if (e.status === 'completed') completedElections++;
      else if (e.status === 'draft') draftElections++;

      const voteCount = e.votes?.length || 0;
      const eligibleCount = e.eligibilities?.length || 0;

      totalVotesSum += voteCount;
      totalEligibleSum += eligibleCount;
    }

    const totalElections = elections.length;
    const averageTurnout =
      totalEligibleSum > 0 ? Number(((totalVotesSum / totalEligibleSum) * 100).toFixed(1)) : 0;

    // 7. Effective Commercial Subscription & Plan Details
    const { subscription, plan, isGracePeriod, gracePeriodEnd } =
      await getEffectiveOrgSubscription(targetOrg.id);

    const statusBadge = getSubscriptionStatusBadge(
      subscription?.status || 'active',
      gracePeriodEnd
    );

    // 8. Construct unified dashboard response
    const dashboardData = {
      id: targetOrg.id,
      name: targetOrg.name,
      slug: targetOrg.slug,
      type: targetOrg.type,
      description: targetOrg.description,
      logo: targetOrg.logo,
      ownerId: targetOrg.ownerId,
      owner: targetOrg.owner
        ? {
            id: targetOrg.owner.id,
            name: targetOrg.owner.name,
            email: targetOrg.owner.email,
            image: targetOrg.owner.image,
          }
        : null,
      createdAt: targetOrg.createdAt,
      updatedAt: targetOrg.updatedAt,
      userRole,
      isOwner,
      canManage,
      memberCount,
      organization: {
        id: targetOrg.id,
        name: targetOrg.name,
        slug: targetOrg.slug,
        type: targetOrg.type,
        description: targetOrg.description,
        logo: targetOrg.logo,
      },
      organizations: formattedUserOrgs,
      stats: {
        totalElections,
        liveElections,
        completedElections,
        draftElections,
        totalVotes: totalVotesSum,
        eligibleVoters: totalEligibleSum,
        averageTurnout,
      },
      plan: {
        id: plan?.id || 'free',
        slug: plan?.slug || 'free',
        name: plan?.name || 'Community (Free)',
        planType: plan?.planType || 'free',
        billingInterval: plan?.billingInterval || 'monthly',
        price: plan?.price || 0,
        formattedPrice: formatPriceInr(plan?.price || 0),
        voterLimitPerElection: plan?.voterLimitPerElection || 50,
        monthlyElectionAllowance: plan?.monthlyElectionAllowance || 2,
        simultaneousLiveElections: plan?.simultaneousLiveElections || 1,
        features: plan?.features || {},
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            billingInterval: subscription.billingInterval,
            startDate: subscription.startDate || subscription.currentPeriodStart,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            nextBillingDate: subscription.nextBillingDate,
            isGracePeriod,
            gracePeriodEnd,
            statusBadge,
          }
        : null,
    };

    return successResponse(dashboardData, 'Organization dashboard information retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
