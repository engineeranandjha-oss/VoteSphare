import { Eligibility, Vote } from '../../models/index.js';
import { ConflictError, ValidationError } from '../utils/error-handler.js';
import { Op } from 'sequelize';

/**
 * Checks if a voter has already cast a ballot in the specified election.
 *
 * @param {string} eligibilityId - Eligibility UUID
 * @param {string} electionId - Election UUID
 * @returns {Promise<boolean>}
 */
export async function hasAlreadyVoted(eligibilityId, electionId) {
  if (!eligibilityId) {
    return false;
  }

  // Check 1: Eligibility status flag
  const eligibility = await Eligibility.findOne({
    where: {
      id: eligibilityId,
      ...(electionId ? { electionId } : {}),
    },
    attributes: ['id', 'status'],
  });

  if (eligibility && eligibility.status === 'voted') {
    return true;
  }

  // Check 2: Actual Vote record presence
  const existingVote = await Vote.findOne({
    where: {
      eligibilityId,
      ...(electionId ? { electionId } : {}),
    },
    attributes: ['id'],
  });

  return Boolean(existingVote);
}

/**
 * Checks if a vote has already been recorded for a specific position under this eligibility record.
 *
 * @param {string} eligibilityId - Eligibility UUID
 * @param {string} positionId - Position UUID
 * @returns {Promise<boolean>}
 */
export async function hasVotedForPosition(eligibilityId, positionId) {
  if (!eligibilityId || !positionId) {
    return false;
  }

  const vote = await Vote.findOne({
    where: {
      eligibilityId,
      positionId,
    },
    attributes: ['id'],
  });

  return Boolean(vote);
}

/**
 * Validates that none of the ballot selections duplicate existing votes.
 *
 * @param {string} eligibilityId - Eligibility UUID
 * @param {string} electionId - Election UUID
 * @param {Array<{ positionId: string, candidateId: string }>} selections - Array of ballot selections
 * @throws {ConflictError | ValidationError}
 * @returns {Promise<{ unique: boolean }>}
 */
export async function validateBallotUniqueness(eligibilityId, electionId, selections = []) {
  if (!eligibilityId || !electionId) {
    throw new ValidationError('Eligibility ID and Election ID are required for uniqueness check');
  }

  // 1. Overall election vote check
  const alreadyVoted = await hasAlreadyVoted(eligibilityId, electionId);
  if (alreadyVoted) {
    throw new ConflictError('A ballot has already been submitted for this election');
  }

  if (!selections || selections.length === 0) {
    return { unique: true };
  }

  // 2. Position-level duplicate check across all submitted positions
  const positionIds = selections.map((s) => s.positionId);
  const existingPositionVotes = await Vote.findAll({
    where: {
      eligibilityId,
      positionId: {
        [Op.in]: positionIds,
      },
    },
    attributes: ['positionId'],
  });

  if (existingPositionVotes.length > 0) {
    throw new ConflictError(
      'One or more positions on this ballot have already been voted on by this elector'
    );
  }

  return { unique: true };
}
