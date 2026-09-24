import { Election } from '@/models';
import { determineElectionWinners } from '@/lib/results/calculation';
import { getCurrentDbUser } from '@/lib/auth/session';
import { canManageElection } from '@/lib/auth/authorization';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, NotFoundError, ForbiddenError } from '@/lib/utils/error-handler';

/**
 * GET /api/elections/[electionId]/winners
 * Retrieve certified winners, margins of victory, runner-ups, and runoff/tie requirements.
 */
export async function GET(request, { params }) {
  try {
    const { electionId } = params;

    const election = await Election.findByPk(electionId, {
      attributes: ['id', 'status'],
    });

    if (!election) {
      throw new NotFoundError('Election not found');
    }

    // Public access is permitted once results are published
    if (election.status !== 'published') {
      const dbUser = await getCurrentDbUser();
      if (!dbUser) {
        throw new ForbiddenError('Authentication required to view preliminary winners before publication');
      }

      const isManager = await canManageElection(dbUser.id, electionId);
      if (!isManager) {
        throw new ForbiddenError('Only election administrators can view preliminary winners before publication');
      }
    }

    const winnersData = await determineElectionWinners(electionId);
    return successResponse(winnersData, 'Election winners determined successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
