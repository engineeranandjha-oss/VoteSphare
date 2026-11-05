export const dynamic = 'force-dynamic';

import { getCurrentDbUser } from '@/lib/auth/session';
import { isMember, canManageElection } from '@/lib/auth/authorization';
import { Election, Certificate, Candidate, Position, User } from '@/models/index.js';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/error-handler';

/**
 * GET /api/elections/[electionId]/certificates
 * Lists all certificates issued for a given election.
 */
export async function GET(request, { params }) {
  try {
    const { electionId } = params;
    const dbUser = await getCurrentDbUser();

    if (!dbUser) {
      throw new UnauthorizedError('Authentication required to view election certificates');
    }

    const election = await Election.findByPk(electionId, {
      attributes: ['id', 'orgId', 'title', 'status'],
    });

    if (!election) {
      throw new NotFoundError('Election not found');
    }

    // Must be member of the org or election manager
    const hasOrgAccess = await isMember(dbUser.id, election.orgId);
    const hasElectionAccess = await canManageElection(dbUser.id, electionId);

    if (!hasOrgAccess && !hasElectionAccess) {
      throw new ForbiddenError('You do not have access to view certificates for this election');
    }

    const certificates = await Certificate.findAll({
      where: { electionId },
      include: [
        {
          model: Position,
          as: 'position',
          attributes: ['id', 'name'],
        },
        {
          model: Candidate,
          as: 'candidate',
          attributes: ['id', 'name', 'photo', 'userId'],
        },
        {
          model: User,
          as: 'revoker',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['certificateType', 'ASC'], // 'victory' first
        ['issuedAt', 'DESC'],
      ],
    });

    return successResponse(
      {
        election: {
          id: election.id,
          title: election.title,
          status: election.status,
        },
        total: certificates.length,
        certificates,
      },
      'Election certificates retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

