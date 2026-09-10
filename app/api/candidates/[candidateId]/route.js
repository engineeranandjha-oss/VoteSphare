import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess, isMember, canManageElection } from '@/lib/auth/authorization';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Candidate, Position, Election } from '@/models/index.js';
import { candidateUpdateSchema } from '@/lib/validations';

/**
 * GET /api/candidates/[candidateId]
 * Get single candidate details.
 */
export async function GET(request, { params }) {
  try {
    const { candidateId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    const candidate = await Candidate.findByPk(candidateId, {
      include: [
        {
          model: Position,
          as: 'position',
          include: [{ model: Election, as: 'election' }],
        },
      ],
    });

    if (!candidate || !candidate.position || !candidate.position.election) {
      throw new NotFoundError('Candidate not found');
    }

    const hasAccess = await isMember(dbUser.id, candidate.position.election.orgId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to view this candidate');
    }

    return successResponse(candidate);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/candidates/[candidateId]
 * Update candidate profile or withdraw candidacy.
 */
export async function PATCH(request, { params }) {
  try {
    const { candidateId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    const candidate = await Candidate.findByPk(candidateId, {
      include: [
        {
          model: Position,
          as: 'position',
          include: [{ model: Election, as: 'election' }],
        },
      ],
    });

    if (!candidate || !candidate.position || !candidate.position.election) {
      throw new NotFoundError('Candidate not found');
    }

    const election = candidate.position.election;
    const isManager = await canManageElection(dbUser.id, election.id);
    const isCandidateThemselves = candidate.userId && candidate.userId === dbUser.id;

    if (!isManager && !isCandidateThemselves) {
      throw new ForbiddenError('You do not have permission to update this candidate');
    }

    const body = await request.json();
    const validatedData = candidateUpdateSchema.parse(body);

    // If attempting withdrawal
    if (validatedData.status === 'withdrawn') {
      const allowWithdrawal = election.config?.allowCandidateWithdrawal !== false;
      if (!allowWithdrawal && election.status !== 'draft') {
        throw new ValidationError('Candidate withdrawal is disabled for this election');
      }
      candidate.status = 'withdrawn';
    } else if (validatedData.status === 'active') {
      if (election.status !== 'draft' && !isManager) {
        throw new ValidationError('Only election managers can reactivate withdrawn candidates');
      }
      candidate.status = 'active';
    }

    // Profile updates (name, bio, photo, manifesto, socialLinks)
    if (election.status !== 'draft' && !isManager) {
      // Non-managers cannot edit profile information once election has started
      if (
        validatedData.name !== undefined ||
        validatedData.photo !== undefined ||
        validatedData.bio !== undefined ||
        validatedData.manifesto !== undefined ||
        validatedData.socialLinks !== undefined
      ) {
        throw new ValidationError('Candidate profile details cannot be modified after election starts');
      }
    } else {
      if (validatedData.name !== undefined) candidate.name = validatedData.name;
      if (validatedData.photo !== undefined) candidate.photo = validatedData.photo;
      if (validatedData.bio !== undefined) candidate.bio = validatedData.bio;
      if (validatedData.manifesto !== undefined) candidate.manifesto = validatedData.manifesto;
      if (validatedData.socialLinks !== undefined) {
        candidate.socialLinks = {
          ...candidate.socialLinks,
          ...validatedData.socialLinks,
        };
      }
      if (validatedData.userId !== undefined && isManager) {
        candidate.userId = validatedData.userId;
      }
    }

    await candidate.save();

    return successResponse(candidate, 'Candidate updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/candidates/[candidateId]
 * Delete a candidate from a position.
 */
export async function DELETE(request, { params }) {
  try {
    const { candidateId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    const candidate = await Candidate.findByPk(candidateId, {
      include: [
        {
          model: Position,
          as: 'position',
          include: [{ model: Election, as: 'election' }],
        },
      ],
    });

    if (!candidate || !candidate.position || !candidate.position.election) {
      throw new NotFoundError('Candidate not found');
    }

    await requireElectionManageAccess(dbUser.id, candidate.position.electionId);

    if (candidate.position.election.status !== 'draft') {
      throw new ValidationError(
        `Cannot delete candidates when election is in '${candidate.position.election.status}' state.`
      );
    }

    await candidate.destroy();

    return successResponse(null, 'Candidate deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
