import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess } from '@/lib/auth/authorization';
import { calculateResults } from '@/lib/results/calculation';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError } from '@/lib/utils/error-handler';

/**
 * GET /api/elections/[electionId]/results/admin
 * Retrieve comprehensive election results, tallies, and audit metrics (Admin only).
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

    // Verify admin/manager permission
    await requireElectionManageAccess(dbUser.id, electionId);

    const results = await calculateResults(electionId);

    return successResponse(
      {
        ...results,
        isAdminView: true,
      },
      'Detailed election results retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
