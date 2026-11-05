import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireElectionManageAccess } from '@/lib/auth/authorization';
import { assertCanEnrollVoters, recordUsage } from '@/lib/billing/entitlements';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError } from '@/lib/utils/error-handler';
import { Eligibility, Member, User, sequelize } from '@/models/index.js';
import { z } from 'zod';

const voterImportSchema = z.object({
  voters: z.array(
    z.object({
      email: z.string().email('Invalid email address').toLowerCase().trim(),
      name: z.string().max(100).optional().nullable(),
    })
  ).min(1, 'Please provide at least one voter record'),
});

/**
 * POST /api/elections/[electionId]/eligibility/import
 * Bulk enrolls voters into the organization (if not already a member)
 * and assigns them eligibility for the specified election.
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

    const election = await requireElectionManageAccess(dbUser.id, electionId);

    const body = await request.json();
    const parseResult = voterImportSchema.parse(body);

    const { voters } = parseResult;

    // Assert organization plan voter capacity limit before entering transaction
    await assertCanEnrollVoters(election.orgId, election.id, voters.length);

    let newlyEnrolled = 0;
    let newlyEligible = 0;
    let alreadyEligible = 0;

    await sequelize.transaction(async (t) => {
      for (const voter of voters) {
        const cleanEmail = voter.email.toLowerCase().trim();
        const displayName = voter.name ? voter.name.trim() : cleanEmail.split('@')[0];

        // 1. Find or create User record
        let [userRecord] = await User.findOrCreate({
          where: { email: cleanEmail },
          defaults: {
            supabaseUserId: `pending-${cleanEmail}`,
            name: displayName,
            email: cleanEmail,
          },
          transaction: t,
        });

        // 2. Find or create Member record in the election's organization
        let [memberRecord] = await Member.findOrCreate({
          where: {
            orgId: election.orgId,
            userId: userRecord.id,
          },
          defaults: {
            orgId: election.orgId,
            userId: userRecord.id,
            role: 'voter',
            status: 'active',
            joinedAt: new Date(),
          },
          transaction: t,
        });

        if (memberRecord.status !== 'active') {
          memberRecord.status = 'active';
          await memberRecord.save({ transaction: t });
          newlyEnrolled++;
        }

        // 3. Find or create Eligibility record for this election
        const [, created] = await Eligibility.findOrCreate({
          where: {
            electionId: election.id,
            memberId: memberRecord.id,
          },
          defaults: {
            electionId: election.id,
            memberId: memberRecord.id,
            status: 'eligible',
          },
          transaction: t,
        });

        if (created) {
          newlyEligible++;
        } else {
          alreadyEligible++;
        }
      }
    });

    const totalEligibleCount = await Eligibility.count({
      where: { electionId: election.id },
    });

    if (newlyEligible > 0) {
      await recordUsage({
        orgId: election.orgId,
        usageType: 'voter_enrolled',
        quantity: newlyEligible,
        electionId: election.id,
      });
    }

    return successResponse(
      {
        totalProcessed: voters.length,
        newlyEligible,
        alreadyEligible,
        newlyEnrolledMembers: newlyEnrolled,
        totalEligibleVoters: totalEligibleCount,
      },
      `Successfully processed ${voters.length} voters: ${newlyEligible} newly added to eligibility roster.`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
