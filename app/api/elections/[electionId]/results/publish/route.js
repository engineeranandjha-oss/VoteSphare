import { getCurrentDbUser } from '@/lib/auth/session';
import { canManageElection } from '@/lib/auth/authorization';
import { publishResults, unpublishResults } from '@/lib/results/publishing';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/utils/error-handler';

/**
 * POST /api/elections/[electionId]/results/publish
 * Publishes official certified results or unpublishes back to ended status.
 *
 * Request Body:
 * {
 *   "action": "publish" | "unpublish",
 *   "notifyVoters": boolean,
 *   "force": boolean
 * }
 */
export async function POST(request, { params }) {
  try {
    const { electionId } = params;
    const dbUser = await getCurrentDbUser();

    if (!dbUser) {
      throw new UnauthorizedError('Authentication required to manage election publishing');
    }

    const isManager = await canManageElection(dbUser.id, electionId);
    if (!isManager) {
      throw new ForbiddenError('You do not have permission to publish or unpublish election results');
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'publish';

    if (action === 'publish') {
      const result = await publishResults(electionId, dbUser.id, {
        notifyVoters: Boolean(body.notifyVoters),
        force: Boolean(body.force),
      });
      return successResponse(result, 'Election results published and officially certified');
    }

    if (action === 'unpublish') {
      const result = await unpublishResults(electionId, dbUser.id);
      return successResponse(result, 'Election results unpublished successfully');
    }

    throw new ValidationError(`Invalid publishing action '${action}'. Must be 'publish' or 'unpublish'.`);
  } catch (error) {
    return handleApiError(error);
  }
}
