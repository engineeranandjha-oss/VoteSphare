import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import {
  startVotingSession,
  getVotingSession,
  expireVotingSession,
} from '@/lib/voting/session';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError } from '@/lib/utils/error-handler';

/**
 * POST /api/elections/[electionId]/session
 * Start a new 15-minute voting session or return the currently active session.
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

    const session = await startVotingSession(dbUser.id, electionId);

    return successResponse(
      session,
      session.isNewSession
        ? 'Voting session started successfully'
        : 'Active voting session resumed'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/elections/[electionId]/session
 * Retrieve current in-progress voting session status and remaining TTL.
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

    const session = getVotingSession(dbUser.id, electionId);

    if (!session) {
      return successResponse(
        { active: false },
        'No active voting session found'
      );
    }

    return successResponse(
      { active: true, ...session },
      'Active voting session retrieved'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/elections/[electionId]/session
 * Cancel or expire the current active voting session.
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

    expireVotingSession(dbUser.id, electionId);

    return successResponse(null, 'Voting session invalidated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
