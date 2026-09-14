import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { checkEligibility } from '@/lib/voting/eligibility-check';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Election, Position, Candidate } from '@/models/index.js';
import { voteCastSchema } from '@/lib/validations';

/**
 * POST /api/elections/[electionId]/vote/confirm
 * Preview and validate ballot selections before final submission.
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

    const body = await request.json();
    const validatedData = voteCastSchema.parse(body);
    const selections = validatedData.selections || validatedData.votes || [];

    // 1. Eligibility Check
    const eligibilityCheck = await checkEligibility(dbUser.id, electionId);
    if (!eligibilityCheck.eligible) {
      throw new ForbiddenError(eligibilityCheck.reason || 'You are not eligible to vote in this election');
    }

    // 2. Fetch full election with positions and active candidates
    const election = await Election.findByPk(electionId, {
      include: [
        {
          model: Position,
          as: 'positions',
          include: [
            {
              model: Candidate,
              as: 'candidates',
              where: { status: 'active' },
              required: false,
            },
          ],
        },
      ],
      order: [[{ model: Position, as: 'positions' }, 'order', 'ASC']],
    });

    if (!election) {
      throw new NotFoundError('Election not found');
    }

    // 3. Prevent duplicate position selections
    const selectedPositionIds = selections.map((s) => s.positionId);
    if (new Set(selectedPositionIds).size !== selectedPositionIds.length) {
      throw new ValidationError('Duplicate position selection detected in ballot preview');
    }

    // 4. Build preview summary
    const allPositions = election.positions || [];
    const previewItems = [];
    const unselectedPositions = [];

    for (const pos of allPositions) {
      const selection = selections.find((s) => s.positionId === pos.id);
      if (selection) {
        const candidate = (pos.candidates || []).find((c) => c.id === selection.candidateId);
        if (!candidate) {
          throw new ValidationError(
            `Selected candidate is invalid, withdrawn, or not registered for position "${pos.name}"`
          );
        }
        previewItems.push({
          positionId: pos.id,
          positionName: pos.name,
          positionDescription: pos.description,
          candidateId: candidate.id,
          candidateName: candidate.name,
          candidatePhoto: candidate.photo,
          candidateBio: candidate.bio,
        });
      } else {
        unselectedPositions.push({
          positionId: pos.id,
          positionName: pos.name,
        });
      }
    }

    const warnings = [];
    if (unselectedPositions.length > 0) {
      warnings.push(
        `You have not selected candidates for ${unselectedPositions.length} position(s): ${unselectedPositions.map((p) => p.positionName).join(', ')}`
      );
    }

    return successResponse(
      {
        valid: true,
        electionId: election.id,
        electionTitle: election.title,
        ballotPreview: previewItems,
        totalPositionsCount: allPositions.length,
        selectedCount: previewItems.length,
        unselectedPositions,
        warnings,
        isAnonymous: validatedData.isAnonymous !== false,
      },
      'Ballot selections verified and ready for confirmation'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
