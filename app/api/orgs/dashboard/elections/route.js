export const dynamic = 'force-dynamic';

import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { Organization, Member, Election, Position, Candidate, Eligibility, Vote } from '@/models/index.js';
import { Op } from 'sequelize';
import { paginatedResponse } from '@/lib/utils/response';
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/utils/error-handler';

/**
 * GET /api/orgs/dashboard/elections
 * Retrieves paginated elections for the authenticated user's active/selected organization.
 * Accepts query params: ?orgId=<uuid-or-slug>&limit=50&page=1&status=live&search=chairman
 * Safely returns empty list with 200 OK when user has no organizations or elections.
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;
    const status = searchParams.get('status')?.trim();
    const search = searchParams.get('search')?.trim();

    // 1. Resolve user's organizations
    const memberships = await Member.findAll({
      where: {
        userId: dbUser.id,
        status: 'active',
      },
      attributes: ['orgId', 'role'],
    });

    const memberOrgIds = memberships.map((m) => m.orgId);

    const userOrganizations = await Organization.findAll({
      where: {
        [Op.or]: [
          { ownerId: dbUser.id },
          { id: { [Op.in]: memberOrgIds } },
        ],
      },
      attributes: ['id', 'name', 'slug', 'ownerId'],
      order: [['createdAt', 'DESC']],
    });

    // 2. Resolve target organization
    let targetOrg = null;

    if (orgIdParam && orgIdParam !== 'dashboard') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdParam);
      targetOrg = userOrganizations.find((o) =>
        isUUID ? o.id === orgIdParam : o.slug?.toLowerCase() === orgIdParam.toLowerCase()
      );

      if (!targetOrg) {
        const foreignOrg = await Organization.findOne({
          where: isUUID ? { id: orgIdParam } : { slug: orgIdParam.toLowerCase() },
          attributes: ['id'],
        });

        if (foreignOrg) {
          throw new ForbiddenError('You do not have permission to view elections for this organization');
        } else {
          throw new NotFoundError('Organization not found');
        }
      }
    } else {
      // Empty state: user has zero organizations and no specific org was requested
      if (userOrganizations.length === 0) {
        return paginatedResponse(
          [],
          {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
          'No elections found for this account'
        );
      }

      // Default to first organization (or owned organization first)
      targetOrg = userOrganizations.find((o) => o.ownerId === dbUser.id) || userOrganizations[0];
    }

    // 4. Query elections with filters and pagination
    const whereClause = { orgId: targetOrg.id };

    if (status && ['draft', 'scheduled', 'live', 'ended', 'completed', 'cancelled', 'archived'].includes(status)) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    const { count, rows: elections } = await Election.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Position,
          as: 'positions',
          attributes: ['id', 'name', 'orderIndex'],
          include: [
            {
              model: Candidate,
              as: 'candidates',
              attributes: ['id'],
              where: { status: 'active' },
              required: false,
            },
          ],
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
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    // 5. Compute election statistics
    const formattedElections = elections.map((e) => {
      const totalVotes = e.votes?.length || 0;
      const eligibleCount = e.eligibilities?.length || 0;
      const candidateCount = e.positions?.reduce((sum, p) => sum + (p.candidates?.length || 0), 0) || 0;
      const turnoutPercentage = eligibleCount > 0 ? Number(((totalVotes / eligibleCount) * 100).toFixed(1)) : 0;

      return {
        id: e.id,
        orgId: e.orgId,
        title: e.title,
        description: e.description,
        status: e.status,
        type: e.type,
        startDate: e.startDate,
        endDate: e.endDate,
        config: e.config,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        positionsCount: e.positions?.length || 0,
        candidatesCount: candidateCount,
        stats: {
          totalVotes,
          totalVoted: totalVotes,
          eligibleVoterCount: eligibleCount,
          totalEligible: eligibleCount,
          turnoutPercentage,
        },
      };
    });

    return paginatedResponse(
      formattedElections,
      {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      'Organization elections retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
