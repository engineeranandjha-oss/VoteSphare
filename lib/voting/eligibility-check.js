import { Election, Member, Eligibility, User } from '../../models/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/error-handler.js';

/**
 * Verifies if a user is eligible to vote in a specific election.
 *
 * @param {string} userId - User UUID
 * @param {string} electionId - Election UUID
 * @returns {Promise<{
 *   eligible: boolean,
 *   reason?: string,
 *   code?: 'ELECTION_NOT_FOUND' | 'ELECTION_NOT_LIVE' | 'ELECTION_NOT_STARTED' | 'ELECTION_ENDED' | 'NOT_ORG_MEMBER' | 'NOT_IN_ROSTER' | 'ALREADY_VOTED' | 'DISQUALIFIED' | 'ELIGIBLE',
 *   eligibilityId?: string,
 *   memberId?: string,
 *   electionId?: string,
 *   orgId?: string,
 *   electionTitle?: string
 * }>}
 */
export async function checkEligibility(userId, electionId) {
  if (!userId || !electionId) {
    return {
      eligible: false,
      reason: 'User ID and Election ID are required',
      code: 'INVALID_INPUT',
    };
  }

  // 1. Fetch Election
  const election = await Election.findByPk(electionId, {
    attributes: ['id', 'orgId', 'title', 'status', 'startDate', 'endDate', 'config'],
  });

  if (!election) {
    return {
      eligible: false,
      reason: 'Election not found',
      code: 'ELECTION_NOT_FOUND',
    };
  }

  // 2. Validate Election Status
  if (election.status !== 'live') {
    return {
      eligible: false,
      reason: `Election is not currently active (status: ${election.status})`,
      code: 'ELECTION_NOT_LIVE',
    };
  }

  // 3. Validate Date Constraints
  const now = new Date();
  if (election.startDate && new Date(election.startDate) > now) {
    return {
      eligible: false,
      reason: 'Election voting window has not opened yet',
      code: 'ELECTION_NOT_STARTED',
    };
  }

  if (election.endDate && new Date(election.endDate) < now) {
    return {
      eligible: false,
      reason: 'Election voting window has closed',
      code: 'ELECTION_ENDED',
    };
  }

  // 4. Validate Organization Membership
  const member = await Member.findOne({
    where: {
      orgId: election.orgId,
      userId,
      status: 'active',
    },
    attributes: ['id', 'role', 'status'],
  });

  if (!member) {
    return {
      eligible: false,
      reason: 'You are not an active member of the host organization',
      code: 'NOT_ORG_MEMBER',
    };
  }

  // 5. Validate Election Eligibility Roster
  const eligibility = await Eligibility.findOne({
    where: {
      electionId: election.id,
      memberId: member.id,
    },
  });

  if (!eligibility) {
    return {
      eligible: false,
      reason: 'You are not registered on the voter eligibility roster for this election',
      code: 'NOT_IN_ROSTER',
    };
  }

  if (eligibility.status === 'voted') {
    return {
      eligible: false,
      reason: 'You have already cast your ballot in this election',
      code: 'ALREADY_VOTED',
    };
  }

  if (eligibility.status === 'disqualified') {
    return {
      eligible: false,
      reason: 'You are disqualified from voting in this election',
      code: 'DISQUALIFIED',
    };
  }

  return {
    eligible: true,
    code: 'ELIGIBLE',
    eligibilityId: eligibility.id,
    memberId: member.id,
    electionId: election.id,
    orgId: election.orgId,
    electionTitle: election.title,
  };
}

/**
 * Fetches all registered eligible voters for an election.
 *
 * @param {string} electionId - Election UUID
 * @param {object} [options]
 * @param {string} [options.status] - Filter by eligibility status
 * @returns {Promise<Array<import('@/models/eligibility.js').Eligibility>>}
 */
export async function getEligibleVoters(electionId, options = {}) {
  const where = { electionId };
  if (options.status) {
    where.status = options.status;
  }

  return Eligibility.findAll({
    where,
    include: [
      {
        model: Member,
        as: 'member',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'image'],
          },
        ],
      },
    ],
    order: [['createdAt', 'ASC']],
  });
}

/**
 * Updates an eligibility record to 'voted' status within an optional transaction.
 *
 * @param {string} eligibilityId - Eligibility UUID
 * @param {object} [transaction] - Sequelize transaction object
 * @throws {NotFoundError | ConflictError | ValidationError}
 * @returns {Promise<import('@/models/eligibility.js').Eligibility>}
 */
export async function markAsVoted(eligibilityId, transaction = null) {
  const options = transaction ? { transaction, lock: transaction.LOCK?.UPDATE } : {};
  const eligibility = await Eligibility.findByPk(eligibilityId, options);

  if (!eligibility) {
    throw new NotFoundError('Eligibility record not found');
  }

  if (eligibility.status === 'voted') {
    throw new ConflictError('Voter has already been marked as voted');
  }

  if (eligibility.status === 'disqualified') {
    throw new ValidationError('Disqualified voter cannot be marked as voted');
  }

  eligibility.status = 'voted';
  await eligibility.save(transaction ? { transaction } : {});

  return eligibility;
}
