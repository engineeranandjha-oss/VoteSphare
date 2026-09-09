import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess, isMember } from '@/lib/auth/authorization';
import { transitionElection } from '@/lib/elections/lifecycle';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Election, Position, Candidate, Organization, Eligibility } from '@/models/index.js';
import { electionUpdateSchema } from '@/lib/validations';

/**
 * GET /api/elections/[electionId]
 * Get full election details including positions, candidates, and organization metadata.
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

    const election = await Election.findByPk(electionId, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'type', 'logo'],
        },
        {
          model: Position,
          as: 'positions',
          include: [
            {
              model: Candidate,
              as: 'candidates',
              order: [['createdAt', 'ASC']],
            },
          ],
        },
        {
          model: Eligibility,
          as: 'eligibilities',
          attributes: ['id', 'status', 'memberId'],
        },
      ],
      order: [
        [{ model: Position, as: 'positions' }, 'order', 'ASC'],
      ],
    });

    if (!election) {
      throw new NotFoundError('Election not found');
    }

    // Check membership in the election's organization
    const hasAccess = await isMember(dbUser.id, election.orgId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this election');
    }

    const plain = election.get({ plain: true });
    const eligibilities = plain.eligibilities || [];
    const totalEligible = eligibilities.length;
    const totalVoted = eligibilities.filter((e) => e.status === 'voted').length;

    // Check current user's eligibility status
    const userEligibility = eligibilities.find((e) => e.memberId === dbUser.id) || null;

    delete plain.eligibilities;

    return successResponse({
      ...plain,
      userEligibilityStatus: userEligibility ? userEligibility.status : 'unknown',
      stats: {
        totalEligible,
        totalVoted,
        turnoutRate: totalEligible > 0 ? ((totalVoted / totalEligible) * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/elections/[electionId]
 * Update election details or trigger lifecycle status transitions.
 */
export async function PATCH(request, { params }) {
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

    // Verify manager permissions (owner, admin, or election creator)
    const election = await requireElectionManageAccess(dbUser.id, electionId);

    const body = await request.json();
    const validatedData = electionUpdateSchema.parse(body);

    // Handle status lifecycle transition if requested
    if (validatedData.status && validatedData.status !== election.status) {
      await transitionElection(election.id, validatedData.status, dbUser.id);
    }

    // Block critical modifications if election is currently live, ended, or published
    const lockedStatuses = ['live', 'ended', 'published'];
    if (lockedStatuses.includes(election.status)) {
      if (
        validatedData.startDate !== undefined ||
        validatedData.config !== undefined
      ) {
        throw new ValidationError('Cannot modify start date or election config while election is active or concluded');
      }
    }

    // Apply updates for allowed fields
    if (validatedData.title !== undefined) election.title = validatedData.title;
    if (validatedData.description !== undefined) election.description = validatedData.description;
    if (validatedData.startDate !== undefined) election.startDate = validatedData.startDate;
    if (validatedData.endDate !== undefined) election.endDate = validatedData.endDate;
    if (validatedData.config !== undefined) {
      election.config = {
        ...election.config,
        ...validatedData.config,
      };
    }

    // Validate start/end date consistency
    if (election.startDate && election.endDate) {
      if (new Date(election.endDate) <= new Date(election.startDate)) {
        throw new ValidationError('End date must be after start date');
      }
    }

    await election.save();

    return successResponse(election, 'Election updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/elections/[electionId]
 * Delete an election. Allowed only in 'draft' or 'archived' state.
 */
export async function DELETE(request, { params }) {
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

    if (election.status !== 'draft' && election.status !== 'archived') {
      throw new ValidationError(
        `Cannot delete election in '${election.status}' state. Only 'draft' or 'archived' elections may be deleted.`
      );
    }

    await election.destroy();

    return successResponse(null, 'Election deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
