import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess, isMember } from '@/lib/auth/authorization';
import { assertCanEnrollVoters, recordUsage } from '@/lib/billing/entitlements';
import { successResponse, paginatedResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Eligibility, Election, Member, User } from '@/models/index.js';
import { eligibilityAssignSchema } from '@/lib/validations';
import { Op } from 'sequelize';

/**
 * GET /api/elections/[electionId]/eligibility
 * List eligible voters for an election with pagination and optional search/status filter.
 */
export async function GET(request, { params }) {
  try {
    const { electionId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    const election = await Election.findByPk(electionId);
    if (!election) {
      throw new NotFoundError('Election not found');
    }

    const hasAccess = await isMember(dbUser.id, election.orgId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this election');
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where = { electionId };
    if (status) {
      where.status = status;
    }

    const memberWhere = {};
    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Eligibility.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Member,
          as: 'member',
          where: memberWhere,
          include: [
            {
              model: User,
              as: 'user',
              where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
              attributes: ['id', 'name', 'email', 'image'],
              required: Object.keys(userWhere).length > 0,
            },
          ],
        },
      ],
      distinct: true,
    });

    return paginatedResponse(rows, { total: count, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/elections/[electionId]/eligibility
 * Assign voter eligibility to members in the organization.
 */
export async function POST(request, { params }) {
  try {
    const { electionId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    const election = await requireElectionManageAccess(dbUser.id, electionId);

    const body = await request.json();
    const validatedData = eligibilityAssignSchema.parse(body);

    let targetMemberIds = [];

    if (validatedData.assignAllActive) {
      // Find all active members belonging to the election's organization
      const activeMembers = await Member.findAll({
        where: {
          orgId: election.orgId,
          status: 'active',
        },
        attributes: ['id'],
      });
      targetMemberIds = activeMembers.map((m) => m.id);
    } else if (validatedData.memberIds && validatedData.memberIds.length > 0) {
      // Verify all provided member IDs belong to this org
      const validMembers = await Member.findAll({
        where: {
          id: validatedData.memberIds,
          orgId: election.orgId,
        },
        attributes: ['id'],
      });
      targetMemberIds = validMembers.map((m) => m.id);
    }

    if (targetMemberIds.length === 0) {
      throw new ValidationError('No eligible members found to assign');
    }

    // Assert organization plan voter capacity limit before bulk assignment
    await assertCanEnrollVoters(election.orgId, electionId, targetMemberIds.length);

    // Prepare bulk records
    const eligibilityRecords = targetMemberIds.map((memberId) => ({
      electionId,
      memberId,
      status: 'eligible',
    }));

    // Perform bulk create with ignore duplicates
    await Eligibility.bulkCreate(eligibilityRecords, {
      ignoreDuplicates: true,
      updateOnDuplicate: ['status'],
    });

    const totalEligibleCount = await Eligibility.count({
      where: { electionId },
    });

    await recordUsage({
      orgId: election.orgId,
      usageType: 'voter_enrolled',
      quantity: targetMemberIds.length,
      electionId,
    });

    return successResponse(
      {
        assignedCount: targetMemberIds.length,
        totalEligibleVoters: totalEligibleCount,
      },
      'Voter eligibility registered successfully',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
