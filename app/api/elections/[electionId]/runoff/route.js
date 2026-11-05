import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess } from '@/lib/auth/authorization';
import { assertCanRunoff } from '@/lib/billing/entitlements';
import { getRunoffPreview, createRunoffElection } from '@/lib/elections/runoff';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  UnauthorizedError,
} from '@/lib/utils/error-handler';

/**
 * GET /api/elections/[electionId]/runoff
 * Returns runoff status, preview of required runoff candidates, and linked child election details.
 */
export async function GET(request, { params }) {
  try {
    const { electionId } = params;
    const preview = await getRunoffPreview(electionId);
    return successResponse(preview, 'Runoff preview details retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/elections/[electionId]/runoff
 * Creates a linked Runoff Election with qualified tied candidates and fresh voter rosters.
 * Preserves the parent election as immutable Round 1.
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

    // Must have election management rights (owner/admin)
    const election = await requireElectionManageAccess(dbUser.id, electionId);

    // Gate runoff creation behind plan entitlement (Pro, Enterprise, Event Pass)
    await assertCanRunoff(election.orgId);

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      startImmediately = false,
      customTitle = null,
      startDate = null,
      endDate = null,
    } = body;

    const result = await createRunoffElection({
      parentElectionId: electionId,
      userId: dbUser.id,
      startImmediately,
      customTitle,
      startDate,
      endDate,
    });

    return successResponse(result, 'Runoff election created and initialized successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
