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
import { positionUpdateSchema } from '@/lib/validations';

/**
 * GET /api/positions/[positionId]
 * Get position details with associated candidates.
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
      include: [
        {
          model: Election,
          as: 'election',
          attributes: ['id', 'orgId', 'title', 'status'],
        },
        {
          model: Candidate,
          as: 'candidates',
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!position) {
      throw new NotFoundError('Position not found');
    }

    const hasAccess = await isMember(dbUser.id, position.election.orgId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this position');
    }

    return successResponse(position);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/positions/[positionId]
 * Update a position's name, description, or order.
 */
export async function PATCH(request, { params }) {
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
        `Cannot modify positions when election is in '${position.election.status}' state.`
      );
    }

    const body = await request.json();
    const validatedData = positionUpdateSchema.parse(body);

    if (validatedData.name !== undefined) position.name = validatedData.name;
    if (validatedData.description !== undefined) position.description = validatedData.description;
    if (validatedData.order !== undefined) position.order = validatedData.order;

    await position.save();

    return successResponse(position, 'Position updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/positions/[positionId]
 * Delete a position.
 */
export async function DELETE(request, { params }) {
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
        `Cannot delete position when election is in '${position.election.status}' state.`
      );
    }

    await position.destroy();

    return successResponse(null, 'Position deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
