import { calculateDetailedTurnout } from '@/lib/results/calculation';
import { successResponse } from '@/lib/utils/response';
import { handleApiError } from '@/lib/utils/error-handler';

/**
 * GET /api/elections/[electionId]/turnout
 * Retrieve granular voter participation rates, remaining electors, and quorum evaluation.
 */
export async function GET(request, { params }) {
  try {
    const { electionId } = params;
    const turnout = await calculateDetailedTurnout(electionId);
    return successResponse(turnout, 'Election turnout statistics retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
