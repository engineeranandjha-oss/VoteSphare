import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess, isMember } from '@/lib/auth/authorization';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Candidate, Position, Election } from '@/models/index.js';
import { candidateCreateSchema } from '@/lib/validations';

/**
 * GET /api/positions/[positionId]/candidates
 * List all candidates for a specific position.
 */
export async function GET(request, { params }) {
  try {
    const { positionId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    const position = await Position.findByPk(positionId, {
      include: [{ model: Election, as: 'election' }],
    });

    if (!position) {
      throw new NotFoundError('Position not found');
    }

    const hasAccess = await isMember(dbUser.id, position.election.orgId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to view this position');
    }

    const candidates = await Candidate.findAll({
      where: { positionId },
      order: [['createdAt', 'ASC']],
    });

    return successResponse(candidates);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/positions/[positionId]/candidates
 * Add a new candidate to a position.
 */
export async function POST(request, { params }) {
  try {
    const { positionId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    const position = await Position.findByPk(positionId, {
      include: [{ model: Election, as: 'election' }],
    });

    if (!position) {
      throw new NotFoundError('Position not found');
    }

    await requireElectionManageAccess(dbUser.id, position.electionId);

    if (position.election.status !== 'draft') {
      throw new ValidationError(
        `Cannot add candidates when election is in '${position.election.status}' state. Must be in 'draft' state.`
      );
    }

    const body = await request.json();
    const validatedData = candidateCreateSchema.parse(body);

    const candidate = await Candidate.create({
      positionId,
      userId: validatedData.userId || null,
      name: validatedData.name,
      photo: validatedData.photo || null,
      bio: validatedData.bio || null,
      manifesto: validatedData.manifesto || null,
      socialLinks: validatedData.socialLinks || {},
      status: 'active',
    });

    return successResponse(candidate, 'Candidate created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
