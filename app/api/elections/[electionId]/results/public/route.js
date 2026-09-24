import { Election } from '@/models/index.js';
import { calculateResults, calculateTurnout } from '@/lib/results/calculation';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/utils/error-handler';

/**
 * GET /api/elections/[electionId]/results/public
 * Retrieve certified public results or live turnout indicators.
 */
export async function GET(request, { params }) {
  try {
    const { electionId } = params;

    const election = await Election.findByPk(electionId, {
      attributes: ['id', 'title', 'status', 'config', 'startDate', 'endDate'],
    });

    if (!election) {
      throw new NotFoundError('Election not found');
    }

    // 1. Election is officially PUBLISHED or ARCHIVED
    if (election.status === 'published' || election.status === 'archived') {
      const results = await calculateResults(electionId);
      return successResponse(
        {
          ...results,
          isCertified: true,
          isPublic: true,
        },
        'Official election results retrieved successfully'
      );
    }

    // 2. Election is LIVE - Check if live turnout is permitted
    if (election.status === 'live') {
      const allowLiveTurnout = election.config?.showLiveTurnout !== false;
      if (!allowLiveTurnout) {
        throw new ForbiddenError('Live turnout analytics are disabled for this active election');
      }

      const turnout = await calculateTurnout(electionId);

      return successResponse(
        {
          electionId: election.id,
          electionTitle: election.title,
          status: 'live',
          isLivePreview: true,
          turnout,
          notice: 'Live participation turnout. Candidate tallies and winners will be published after voting concludes.',
        },
        'Live turnout statistics retrieved'
      );
    }

    // 3. Status is draft, scheduled, or ended (awaiting tally certification)
    throw new ForbiddenError(
      `Results are not available for election in '${election.status}' state. Official results will be published once certified by the election committee.`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
