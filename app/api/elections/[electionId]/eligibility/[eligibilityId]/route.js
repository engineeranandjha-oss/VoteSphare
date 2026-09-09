import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess } from '@/lib/auth/authorization';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Eligibility } from '@/models/index.js';
import { eligibilityUpdateSchema } from '@/lib/validations';

/**
 * PATCH /api/elections/[electionId]/eligibility/[eligibilityId]
 * Update a voter's eligibility status (e.g. disqualify).
 */
export async function PATCH(request, { params }) {
  try {
    const { electionId, eligibilityId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    await requireElectionManageAccess(dbUser.id, electionId);

    const eligibility = await Eligibility.findOne({
      where: {
        id: eligibilityId,
        electionId,
      },
    });

    if (!eligibility) {
      throw new NotFoundError('Eligibility record not found');
    }

    const body = await request.json();
    const validatedData = eligibilityUpdateSchema.parse(body);

    if (eligibility.status === 'voted' && validatedData.status !== 'voted') {
      throw new ValidationError('Cannot modify eligibility status of a voter who has already cast their vote');
    }

    eligibility.status = validatedData.status;
    await eligibility.save();

    return successResponse(eligibility, 'Eligibility updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/elections/[electionId]/eligibility/[eligibilityId]
 * Remove a member from the election eligibility list.
 */
export async function DELETE(request, { params }) {
  try {
    const { electionId, eligibilityId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    const election = await requireElectionManageAccess(dbUser.id, electionId);

    const eligibility = await Eligibility.findOne({
      where: {
        id: eligibilityId,
        electionId,
      },
    });

    if (!eligibility) {
      throw new NotFoundError('Eligibility record not found');
    }

    if (eligibility.status === 'voted') {
      throw new ValidationError('Cannot remove a voter who has already cast a vote in this election');
    }

    if (election.status === 'live') {
      throw new ValidationError('Cannot remove eligible voters while an election is live');
    }

    await eligibility.destroy();

    return successResponse(null, 'Voter removed from election eligibility');
  } catch (error) {
    return handleApiError(error);
  }
}
