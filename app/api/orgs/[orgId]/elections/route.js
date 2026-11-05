import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireOrgRole, isMember } from '@/lib/auth/authorization';
import { successResponse, paginatedResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Organization, Election, Position, Eligibility, Candidate } from '@/models/index.js';
import { electionCreateSchema } from '@/lib/validations';
import { assertCanCreateElection, recordUsage } from '@/lib/billing/entitlements';
import { Op } from 'sequelize';

/**
 * Helper to resolve organization by ID or slug
 */
async function resolveOrganization(orgId) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
  return Organization.findOne({
    where: isUUID ? { id: orgId } : { slug: orgId.toLowerCase() },
  });
}

/**
 * GET /api/orgs/[orgId]/elections
 * List all elections in an organization with pagination, search, and status filter.
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

    const organization = await resolveOrganization(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Must be member of the organization
    const hasMembership = await isMember(dbUser.id, organization.id);
    if (!hasMembership) {
      throw new ForbiddenError('You are not a member of this organization');
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where = { orgId: organization.id };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Election.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Position,
          as: 'positions',
          attributes: ['id', 'name'],
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
      ],
      distinct: true,
    });

    // Format response to include summary metrics
    const data = rows.map((election) => {
      const plain = election.get({ plain: true });
      const totalEligible = plain.eligibilities ? plain.eligibilities.length : 0;
      const totalVoted = plain.eligibilities
        ? plain.eligibilities.filter((e) => e.status === 'voted').length
        : 0;
      const positionsCount = plain.positions ? plain.positions.length : 0;
      const candidatesCount = plain.positions
        ? plain.positions.reduce((acc, p) => acc + (p.candidates ? p.candidates.length : 0), 0)
        : 0;

      delete plain.eligibilities;

      return {
        ...plain,
        stats: {
          positionCount: positionsCount,
          positionsCount,
          candidateCount: candidatesCount,
          candidatesCount,
          eligibleVoterCount: totalEligible,
          totalEligible,
          totalVotes: totalVoted,
          totalVoted,
          turnoutRate: totalEligible > 0 ? ((totalVoted / totalEligible) * 100).toFixed(1) : 0,
          turnoutPercentage: totalEligible > 0 ? ((totalVoted / totalEligible) * 100).toFixed(1) : 0,
        },
      };
    });

    return paginatedResponse(data, page, limit, count);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/orgs/[orgId]/elections
 * Create a new election in an organization. Restricted to owners and admins.
 */
export async function POST(request, { params }) {
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

    const organization = await resolveOrganization(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Require Owner or Admin role
    await requireOrgRole(dbUser.id, organization.id, ['owner', 'admin']);

    // Enforce subscription plan monthly election quota
    await assertCanCreateElection(organization.id);

    const body = await request.json();
    const validatedData = electionCreateSchema.parse(body);

    // Validate dates if both provided
    if (validatedData.startDate && validatedData.endDate) {
      if (new Date(validatedData.endDate) <= new Date(validatedData.startDate)) {
        throw new ValidationError('End date must be after start date');
      }
    }

    const election = await Election.create({
      orgId: organization.id,
      title: validatedData.title,
      description: validatedData.description || null,
      startDate: validatedData.startDate || null,
      endDate: validatedData.endDate || null,
      config: validatedData.config || {},
      status: 'draft',
      createdBy: dbUser.id,
    });

    // Record usage telemetry
    recordUsage({
      orgId: organization.id,
      usageType: 'election_created',
      quantity: 1,
      electionId: election.id,
    });

    return successResponse(election, 'Election created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
