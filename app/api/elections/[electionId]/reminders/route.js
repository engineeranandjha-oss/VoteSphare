import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess } from '@/lib/auth/authorization';
import { Eligibility, User, Organization } from '@/models/index.js';
import { sendBatchElectionReminders } from '@/lib/email/election-notifications';
import { getDirectVotingBoothUrl } from '@/lib/sharing/links';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/utils/error-handler';

/**
 * POST /api/elections/[electionId]/reminders
 * Dispatch bulk voting reminder emails to eligible unvoted electors for an election.
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

    const body = await request.json().catch(() => ({}));
    const { customMessage = '', notifyAllUnvoted = true } = body;
    let emails = Array.isArray(body.emails) ? body.emails : [];

    // If notifyAllUnvoted is true, gather all eligible voters who haven't cast a ballot (status === 'eligible')
    if (notifyAllUnvoted) {
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

      const unvotedEmails = eligibilities
        .map((e) => e.user?.email || e.email)
        .filter(Boolean);

      emails = Array.from(new Set([...emails, ...unvotedEmails]));
    }

    if (emails.length === 0) {
      throw new ValidationError('No unvoted eligible recipients found to send reminders');
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

    const results = await sendBatchElectionReminders(emails, electionData);

    return successResponse(
      results,
      `Successfully dispatched ${results.sent} of ${results.total} election reminders`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
