export const dynamic = 'force-dynamic';

import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { Member, Organization, Election } from '@/models/index.js';
import { Op } from 'sequelize';
import { generateBlindHash } from '@/lib/voting/anonymity.js';
import { getEffectiveOrgSubscription } from '@/lib/billing/entitlements';
import { formatPriceInr } from '@/lib/billing/plans-config';
import { getSubscriptionStatusBadge } from '@/lib/billing/subscription-lifecycle';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError, ValidationError } from '@/lib/utils/error-handler';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters').trim().optional(),
  image: z.string().optional().nullable().or(z.literal('')),
});

/**
 * GET /api/user/profile
 * Retrieves detailed profile, cryptographic identity, organization memberships,
 * and current commercial subscription / plan entitlement telemetry.
 */
export async function GET(request) {
  try {
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User authentication failed');
    }

    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId')?.trim();

    // 1. Fetch active memberships
    const memberships = await Member.findAll({
      where: { userId: dbUser.id, status: 'active' },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'type', 'description', 'logo', 'ownerId', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // 2. Fetch owned organizations
    const ownedOrgs = await Organization.findAll({
      where: { ownerId: dbUser.id },
      attributes: ['id', 'name', 'slug', 'type', 'description', 'logo', 'ownerId', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    // 3. Construct unified user organizations map
    const allUserOrgsMap = new Map();
    for (const org of ownedOrgs) {
      allUserOrgsMap.set(org.id, {
        id: org.id,
        name: org.name,
        slug: org.slug,
        type: org.type,
        logo: org.logo,
        userRole: 'owner',
        isOwner: true,
        createdAt: org.createdAt,
      });
    }

    for (const m of memberships) {
      if (m.organization && !allUserOrgsMap.has(m.organization.id)) {
        allUserOrgsMap.set(m.organization.id, {
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          type: m.organization.type,
          logo: m.organization.logo,
          userRole: m.role || 'voter',
          isOwner: m.organization.ownerId === dbUser.id,
          createdAt: m.organization.createdAt,
        });
      }
    }

    const userOrgs = Array.from(allUserOrgsMap.values());

    // 4. Resolve selected organization for subscription inspection
    let selectedOrg = null;
    if (orgIdParam) {
      selectedOrg = userOrgs.find((o) => o.id === orgIdParam || o.slug?.toLowerCase() === orgIdParam.toLowerCase());
    }
    if (!selectedOrg && userOrgs.length > 0) {
      selectedOrg = userOrgs.find((o) => o.isOwner) || userOrgs[0];
    }

    // 5. Compute commercial subscription & usage meters for selected organization
    let currentSubscription = null;
    if (selectedOrg) {
      const { subscription, plan, isGracePeriod, gracePeriodEnd } =
        await getEffectiveOrgSubscription(selectedOrg.id);

      const statusBadge = getSubscriptionStatusBadge(
        subscription?.status || 'active',
        gracePeriodEnd
      );

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyElectionsUsed = await Election.count({
        where: {
          orgId: selectedOrg.id,
          createdAt: { [Op.gte]: startOfMonth },
        },
      });

      const liveElectionsUsed = await Election.count({
        where: {
          orgId: selectedOrg.id,
          status: { [Op.in]: ['live', 'scheduled'] },
        },
      });

      currentSubscription = {
        organization: selectedOrg,
        userRole: selectedOrg.userRole,
        isOwner: selectedOrg.isOwner,
        canManageBilling: selectedOrg.isOwner,
        plan: {
          id: plan?.id || 'free',
          slug: plan?.slug || 'free',
          name: plan?.name || 'Community (Free)',
          description: plan?.description || 'Essential democratic voting tier.',
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
          : {
              id: null,
              status: 'active',
              billingInterval: 'monthly',
              startDate: selectedOrg.createdAt,
              currentPeriodStart: selectedOrg.createdAt,
              currentPeriodEnd: null,
              nextBillingDate: null,
              isGracePeriod: false,
              gracePeriodEnd: null,
              statusBadge: {
                label: 'Free Forever',
                variant: 'default',
              },
            },
        usage: {
          monthlyElectionsUsed,
          monthlyElectionAllowance: plan?.monthlyElectionAllowance || 2,
          monthlyElectionsRemaining: Math.max(0, (plan?.monthlyElectionAllowance || 2) - monthlyElectionsUsed),
          liveElectionsUsed,
          simultaneousLiveElections: plan?.simultaneousLiveElections || 1,
          voterLimitPerElection: plan?.voterLimitPerElection || 50,
        },
      };
    }

    const cryptographicFingerprint = generateBlindHash(dbUser.id);

    const formattedMemberships = memberships.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt || m.createdAt,
      organization: m.organization ? m.organization.toJSON() : null,
    }));

    return successResponse(
      {
        user: {
          id: dbUser.id,
          supabaseUserId: dbUser.supabaseUserId,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image,
          createdAt: dbUser.createdAt,
          updatedAt: dbUser.updatedAt,
        },
        cryptographicFingerprint,
        memberships: formattedMemberships,
        userOrganizations: userOrgs,
        currentSubscription,
      },
      'User profile retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/user/profile
 * Updates user profile attributes (e.g. display name).
 */
export async function PATCH(request) {
  try {
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User authentication failed');
    }

    const body = await request.json();
    const parseResult = updateProfileSchema.safeParse(body);

    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const { name, image } = parseResult.data;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image || null;

    await dbUser.update(updateData);

    return successResponse(
      {
        id: dbUser.id,
        supabaseUserId: dbUser.supabaseUserId,
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image,
        updatedAt: dbUser.updatedAt,
      },
      'Profile updated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
