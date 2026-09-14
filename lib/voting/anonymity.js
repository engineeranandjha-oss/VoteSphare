import crypto from 'crypto';
import { Vote } from '../../models/index.js';

/**
 * Validates the anonymity architecture of votes stored for an election.
 * Ensures no direct user identification or personal data is linked to ballot choices.
 *
 * @param {string} electionId - Election UUID
 * @returns {Promise<{
 *   anonymous: boolean,
 *   voteCount: number,
 *   auditedAttributes: string[],
 *   hasUserIdentifier: boolean
 * }>}
 */
export async function verifyAnonymityIntegrity(electionId) {
  const modelAttributes = Object.keys(Vote.rawAttributes || {});
  const forbiddenUserKeys = ['userId', 'user_id', 'voterId', 'voter_id', 'email', 'name'];

  const hasUserIdentifier = forbiddenUserKeys.some((key) =>
    modelAttributes.includes(key)
  );

  let voteCount = null;
  try {
    voteCount = await Vote.count({
      where: electionId ? { electionId } : {},
    });
  } catch {
    // Gracefully handle offline / schema-only audits
    voteCount = 0;
  }

  return {
    anonymous: !hasUserIdentifier,
    voteCount,
    auditedAttributes: modelAttributes,
    hasUserIdentifier,
  };
}

/**
 * Sanitizes a vote record to strip internal references or timing identifiers before tally calculation.
 *
 * @param {object} vote - Raw or plain Vote model instance
 * @returns {{ id: string, positionId: string, candidateId: string, electionId: string }}
 */
export function sanitizeVotePayload(vote) {
  if (!vote) {
    return null;
  }

  const plain = typeof vote.get === 'function' ? vote.get({ plain: true }) : vote;

  return {
    id: plain.id,
    positionId: plain.positionId,
    candidateId: plain.candidateId,
    electionId: plain.electionId,
    isAnonymous: plain.isAnonymous,
  };
}

/**
 * Generates an irreversible cryptographic blind hash for audit proof verification.
 *
 * @param {string} seed - Input identifier
 * @returns {string} SHA-256 blind hash
 */
export function generateBlindHash(seed) {
  return crypto.createHash('sha256').update(String(seed)).digest('hex');
}
