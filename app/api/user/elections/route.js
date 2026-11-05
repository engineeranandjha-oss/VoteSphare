import { getCurrentDbUser } from '@/lib/auth/session';
import { Member, Eligibility, Election, Organization, Position } from '@/models';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError } from '@/lib/utils/error-handler';

/**
 * GET /api/user/elections
 * Retrieve all elections associated with the authenticated voter, grouped by participation status.
 */
export async function GET() {
  try {
    const dbUser = await getCurrentDbUser();
    if (!dbUser) {
      throw new UnauthorizedError('Authentication required');
    }

    // 1. Fetch user's active organization memberships
    const members = await Member.findAll({
      where: { userId: dbUser.id, status: 'active' },
      attributes: ['id', 'orgId', 'role'],
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'logo', 'type', 'description'],
        },
      ],
    });

    const memberIds = members.map((m) => m.id);
    const memberMap = new Map(members.map((m) => [m.id, m]));

    const userOrganizations = members
      .map((m) => m.organization)
      .filter(Boolean);

    if (memberIds.length === 0) {
      return successResponse(
        {
          stats: {
            activeCount: 0,
            votedCount: 0,
            upcomingCount: 0,
            concludedCount: 0,
            orgCount: 0,
            participationRate: 0,
          },
          organizations: [],
          activeToVote: [],
          voted: [],
          upcoming: [],
          concluded: [],
        },
        'Voter elections retrieved successfully'
      );
    }

    // 2. Fetch all eligibility records across user's memberships
    const eligibilities = await Eligibility.findAll({
      where: { memberId: memberIds },
      include: [
        {
          model: Election,
          as: 'election',
          include: [
            {
              model: Position,
              as: 'positions',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    const activeToVote = [];
    const voted = [];
    const upcoming = [];
    const concluded = [];

    for (const elig of eligibilities) {
      const elec = elig.election;
      if (!elec) continue;

      const member = memberMap.get(elig.memberId);
      const electionItem = {
        eligibilityId: elig.id,
        eligibilityStatus: elig.status,
        electionId: elec.id,
        title: elec.title,
        description: elec.description,
        status: elec.status,
        startDate: elec.startDate,
        endDate: elec.endDate,
        positionsCount: elec.positions?.length || 0,
        positions: elec.positions || [],
        organization: member?.organization || null,
        userRole: member?.role || 'voter',
        votedAt: elig.status === 'voted' ? elig.updatedAt : null,
        config: elec.config || {},
      };

      if (elec.status === 'live' && elig.status === 'eligible') {
        activeToVote.push(electionItem);
      } else if (elig.status === 'voted') {
        voted.push(electionItem);
      } else if (elec.status === 'scheduled') {
        upcoming.push(electionItem);
      } else if (elec.status === 'ended' || elec.status === 'published' || elec.status === 'archived') {
        concluded.push(electionItem);
      }
    }

    const totalElectorateOpportunities = activeToVote.length + voted.length;
    const participationRate =
      totalElectorateOpportunities > 0
        ? Math.round((voted.length / totalElectorateOpportunities) * 100)
        : voted.length > 0
        ? 100
        : 0;

    return successResponse(
      {
        stats: {
          activeCount: activeToVote.length,
          votedCount: voted.length,
          upcomingCount: upcoming.length,
          concludedCount: concluded.length,
          orgCount: members.length,
          participationRate,
        },
        organizations: userOrganizations,
        activeToVote,
        voted,
        upcoming,
        concluded,
      },
      'Voter elections retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
