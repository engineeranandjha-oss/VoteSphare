import crypto from 'crypto';
import sequelize from '@/lib/sequelize';
import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { checkEligibility, markAsVoted } from '@/lib/voting/eligibility-check';
import { validateBallotUniqueness } from '@/lib/voting/duplicate-check';
import {
  verifyVotingSessionToken,
  getVotingSession,
  completeVotingSession,
} from '@/lib/voting/session';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Election, Position, Candidate, Vote } from '@/models/index.js';
import { voteCastSchema } from '@/lib/validations';

/**
 * POST /api/elections/[electionId]/vote
 * Cast an atomic ballot across election positions.
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

    // 1. Session & Token Verification
    let activeSessionId = null;
    if (validatedData.token) {
      const tokenPayload = verifyVotingSessionToken(validatedData.token);
      if (tokenPayload.electionId !== electionId) {
        throw new ValidationError('Token does not match the target election');
      }
      if (tokenPayload.userId !== dbUser.id) {
        throw new ForbiddenError('Voting session token does not belong to the authenticated user');
      }
      activeSessionId = tokenPayload.sessionId;
    } else {
      const activeSession = getVotingSession(dbUser.id, electionId);
      if (activeSession) {
        activeSessionId = activeSession.sessionId;
      }
    }

    // 2. Election & Eligibility Verification
    const election = await Election.findByPk(electionId);
    if (!election) {
      throw new NotFoundError('Election not found');
    }

    const eligibilityCheck = await checkEligibility(dbUser.id, electionId);
    if (!eligibilityCheck.eligible) {
      throw new ForbiddenError(eligibilityCheck.reason || 'You are not eligible to vote in this election');
    }

    // 3. Prevent duplicate position selections in single payload
    const selectedPositionIds = selections.map((s) => s.positionId);
    if (new Set(selectedPositionIds).size !== selectedPositionIds.length) {
      throw new ValidationError('Duplicate position selection detected in ballot');
    }

    // 4. Validate Position and Candidate Integrity
    const validPositions = await Position.findAll({
      where: {
        id: selectedPositionIds,
        electionId,
      },
      include: [
        {
          model: Candidate,
          as: 'candidates',
          where: { status: 'active' },
          required: false,
        },
      ],
    });

    if (validPositions.length !== selectedPositionIds.length) {
      throw new ValidationError('One or more selected positions are invalid for this election');
    }

    for (const sel of selections) {
      const pos = validPositions.find((p) => p.id === sel.positionId);
      if (!pos) {
        throw new ValidationError(`Invalid position ID: ${sel.positionId}`);
      }
      const activeCandidate = pos.candidates?.find((c) => c.id === sel.candidateId);
      if (!activeCandidate) {
        throw new ValidationError(
          `Selected candidate is invalid, withdrawn, or not registered for position "${pos.name}"`
        );
      }
    }

    // 5. Check for existing votes (Application-level duplicate prevention)
    await validateBallotUniqueness(eligibilityCheck.eligibilityId, electionId, selections);

    // 6. Execute Atomic Vote Transaction
    const timestamp = new Date();
    await sequelize.transaction(async (t) => {
      // Step A: Mark eligibility as voted (locks row)
      await markAsVoted(eligibilityCheck.eligibilityId, t);

      // Step B: Bulk insert anonymous votes
      const voteRecords = selections.map((sel) => ({
        electionId,
        positionId: sel.positionId,
        candidateId: sel.candidateId,
        eligibilityId: eligibilityCheck.eligibilityId,
        isAnonymous: validatedData.isAnonymous !== false,
        timestamp,
      }));

      await Vote.bulkCreate(voteRecords, { transaction: t });
    });

    // 7. Complete and consume voting session
    if (activeSessionId) {
      completeVotingSession(activeSessionId, dbUser.id, electionId);
    }

    // 8. Generate Cryptographic Vote Receipt Hash
    const receiptSeed = `${electionId}:${eligibilityCheck.eligibilityId}:${timestamp.getTime()}`;
    const receiptHash = crypto
      .createHash('sha256')
      .update(receiptSeed)
      .digest('hex')
      .substring(0, 24)
      .toUpperCase();

    const receiptId = `VS-${receiptHash.match(/.{1,4}/g).join('-')}`;

    return successResponse(
      {
        receiptId,
        electionId,
        electionTitle: election.title,
        timestamp: timestamp.toISOString(),
        positionsVotedCount: selections.length,
        isAnonymous: validatedData.isAnonymous !== false,
      },
      'Ballot successfully cast and recorded',
      201
    );
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return handleApiError(
        new ForbiddenError('A ballot has already been recorded for this voter or position')
      );
    }
    return handleApiError(error);
  }
}
