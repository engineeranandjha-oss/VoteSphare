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
import { Position, Election, Candidate } from '@/models/index.js';
import { positionCreateSchema } from '@/lib/validations';

/**
 * GET /api/elections/[electionId]/positions
 * List all positions and their candidates for an election.
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

    const positions = await Position.findAll({
      where: { electionId },
      include: [
        {
          model: Candidate,
          as: 'candidates',
          order: [['createdAt', 'ASC']],
        },
      ],
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });

    return successResponse(positions);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/elections/[electionId]/positions
 * Create a new position in an election.
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

    if (election.status !== 'draft') {
      throw new ValidationError(
        `Cannot add positions when election is in '${election.status}' state. Must be in 'draft' state.`
      );
    }

    const body = await request.json();
    const validatedData = positionCreateSchema.parse(body);

    // If order was not explicitly specified or 0, calculate next order index
    let orderIndex = validatedData.order;
    if (orderIndex === 0) {
      const maxOrderPos = await Position.findOne({
        where: { electionId },
        order: [['order', 'DESC']],
      });
      orderIndex = maxOrderPos ? maxOrderPos.order + 1 : 1;
    }

    const position = await Position.create({
      electionId,
      name: validatedData.name,
      description: validatedData.description || null,
      order: orderIndex,
    });

    return successResponse(position, 'Position created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
