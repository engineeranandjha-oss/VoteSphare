import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess } from '@/lib/auth/authorization';
import { Eligibility, User, Organization } from '@/models/index.js';
import { sendBatchElectionInvitations } from '@/lib/email/election-notifications';
import { getDirectVotingBoothUrl } from '@/lib/sharing/links';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/utils/error-handler';

/**
 * POST /api/elections/[electionId]/invitations
 * Dispatch bulk voter email invitations for an election.
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
      throw new UnauthorizedError('Authentication failed');
    }

    // Verify election exists and user is owner or admin
    const election = await requireElectionManageAccess(dbUser.id, electionId);
    const organization = await Organization.findByPk(election.orgId);

    const body = await request.json();
    const { customMessage = '', notifyAllEligible = false } = body;
    let emails = Array.isArray(body.emails) ? body.emails : [];

    // If notifyAllEligible is selected, gather emails from eligibility list
    if (notifyAllEligible) {
      const eligibilities = await Eligibility.findAll({
        where: { electionId, status: 'eligible' },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          },
        ],
      });

      const eligibleEmails = eligibilities
        .map((e) => e.user?.email || e.email)
        .filter(Boolean);

      emails = Array.from(new Set([...emails, ...eligibleEmails]));
    }

    if (emails.length === 0) {
      throw new ValidationError('No recipient email addresses provided or enrolled for invitation');
    }

    // Determine host baseUrl dynamically from headers or default
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : undefined;
    const voteUrl = getDirectVotingBoothUrl(electionId, baseUrl);

    const electionData = {
      title: election.title,
      orgName: organization?.name || 'Organization',
      voteUrl,
      startDate: election.startDate ? new Date(election.startDate).toLocaleString() : null,
      endDate: election.endDate ? new Date(election.endDate).toLocaleString() : null,
      customMessage: customMessage.trim(),
    };

    const results = await sendBatchElectionInvitations(emails, electionData);

    return successResponse(
      results,
      `Successfully dispatched ${results.sent} of ${results.total} email invitations`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
