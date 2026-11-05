import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { checkEligibility } from '@/lib/voting/eligibility-check';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError } from '@/lib/utils/error-handler';

/**
 * GET /api/elections/[electionId]/check-eligibility
 * Check the authenticated voter's eligibility status for an election.
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

    const isEmailConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
    if (!isEmailConfirmed && process.env.NODE_ENV !== 'test') {
      return successResponse(
        {
          eligible: false,
          reason: 'Email verification is required before voting. Please verify your email address.',
          code: 'EMAIL_NOT_VERIFIED',
          electionId,
        },
        'Email verification required'
      );
    }

    const result = await checkEligibility(dbUser.id, electionId);

    return successResponse(result, result.eligible ? 'Voter is eligible' : result.reason);
  } catch (error) {
    return handleApiError(error);
  }
}
