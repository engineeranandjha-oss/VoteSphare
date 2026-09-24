import { Election, AuditLog } from '../../models/index.js';
import { calculateResults, determineElectionWinners } from './calculation.js';
import { transitionElection } from '../elections/lifecycle.js';
import { ValidationError, NotFoundError } from '../utils/error-handler.js';

/**
 * Validates whether an election is eligible to have its results published.
 *
 * @param {object} election - Election model or object
 * @throws {ValidationError}
 */
export function validateCanPublish(election) {
  if (!election) {
    throw new ValidationError('Election is required');
  }

  if (election.status !== 'ended' && election.status !== 'published') {
    throw new ValidationError(
      `Cannot publish results for an election in '${election.status}' status. Election must be 'ended' first.`
    );
  }
}

/**
 * Publishes and officially certifies election results.
 *
 * @param {string} electionId - Election UUID
 * @param {string} [userId] - Administrator UUID performing the publication
 * @param {object} [options={}] - Publishing options
 * @param {boolean} [options.notifyVoters=false] - Whether to send notifications to voters
 * @param {boolean} [options.force=false] - Whether to bypass status check
 * @returns {Promise<{
 *   success: boolean,
 *   electionId: string,
 *   status: string,
 *   publishedAt: string,
 *   publishedBy: string | null,
 *   snapshot: object
 * }>}
 */
export async function publishResults(electionId, userId = null, options = {}) {
  const election = await Election.findByPk(electionId);

  if (!election) {
    throw new NotFoundError('Election not found');
  }

  if (!options.force) {
    validateCanPublish(election);
  }

  // Calculate complete certified results and winner summaries
  const [fullResults, winnersData] = await Promise.all([
    calculateResults(electionId),
    determineElectionWinners(electionId),
  ]);

  const publishedAt = new Date().toISOString();

  // Create immutable snapshot of certified results
  const certifiedSnapshot = {
    certifiedAt: publishedAt,
    winningRule: winnersData.winningRule,
    isFullyDecided: winnersData.isFullyDecided,
    hasTies: winnersData.hasTies,
    positionSummary: winnersData.positionSummary,
    turnout: fullResults.turnout,
    totalVotesCast: fullResults.totalVotesCast,
    positions: winnersData.positions.map((p) => ({
      positionId: p.positionId,
      positionName: p.positionName,
      seatsAvailable: p.seatsAvailable,
      status: p.status,
      totalVotes: p.totalVotes,
      winners: p.winners.map((w) => ({
        id: w.id,
        name: w.name,
        voteCount: w.voteCount,
        percentage: w.percentage,
      })),
      marginVotes: p.marginVotes,
      marginPercentage: p.marginPercentage,
      requiresRunoff: p.requiresRunoff,
    })),
  };

  // Perform state machine transition if not already in published state
  if (election.status !== 'published') {
    await transitionElection(electionId, 'published', userId);
  }

  // Attach publishing audit metadata & snapshot to config
  const config = { ...(election.config || {}) };
  config.publishingDetails = {
    publishedAt,
    publishedBy: userId,
    certifiedSnapshot,
    notificationSent: Boolean(options.notifyVoters),
  };

  election.config = config;
  await election.save();

  // Dispatch results announcement emails if notifyVoters requested
  if (options.notifyVoters) {
    try {
      const { Eligibility, User: UserModel, Organization: OrgModel } = await import('../../models/index.js');
      const { sendBatchElectionResults } = await import('../email/election-notifications.js');
      const { getPublicResultsUrl } = await import('../sharing/links.js');

      const eligibilities = await Eligibility.findAll({
        where: { electionId },
        include: [{ model: UserModel, as: 'user', attributes: ['email'] }],
      });
      const org = await OrgModel.findByPk(election.orgId);
      const emails = eligibilities.map((e) => e.user?.email || e.email).filter(Boolean);
      const resultsUrl = getPublicResultsUrl(electionId);

      if (emails.length > 0) {
        await sendBatchElectionResults(emails, {
          title: election.title,
          orgName: org?.name || 'Organization',
          resultsUrl,
          certifiedAt: publishedAt,
        });
      }
    } catch {
      // Non-blocking notification dispatch
    }
  }

  // Create audit log entry
  try {
    await AuditLog.create({
      orgId: election.orgId,
      userId,
      action: 'RESULTS_PUBLISHED',
      details: {
        electionId: election.id,
        publishedAt,
        publishedBy: userId,
        isFullyDecided: winnersData.isFullyDecided,
      },
    });
  } catch {
    // Ignore audit log persistence errors
  }

  return {
    success: true,
    electionId: election.id,
    status: 'published',
    publishedAt,
    publishedBy: userId,
    snapshot: certifiedSnapshot,
  };
}

/**
 * Unpublishes election results and reverts state back to ended for administrative review.
 *
 * @param {string} electionId - Election UUID
 * @param {string} [userId] - Administrator UUID initiating unpublication
 * @returns {Promise<{
 *   success: boolean,
 *   electionId: string,
 *   status: string,
 *   unpublishedAt: string,
 *   unpublishedBy: string | null
 * }>}
 */
export async function unpublishResults(electionId, userId = null) {
  const election = await Election.findByPk(electionId);

  if (!election) {
    throw new NotFoundError('Election not found');
  }

  if (election.status !== 'published') {
    throw new ValidationError(
      `Cannot unpublish election in '${election.status}' status. Only 'published' elections can be unpublished.`
    );
  }

  const unpublishedAt = new Date().toISOString();

  // Revert status to ended
  await transitionElection(electionId, 'ended', userId);

  // Update publishing metadata
  const config = { ...(election.config || {}) };
  if (config.publishingDetails) {
    config.publishingDetails.unpublishedAt = unpublishedAt;
    config.publishingDetails.unpublishedBy = userId;
  }
  election.config = config;
  await election.save();

  // Audit log entry
  try {
    await AuditLog.create({
      orgId: election.orgId,
      userId,
      action: 'RESULTS_UNPUBLISHED',
      details: {
        electionId: election.id,
        unpublishedAt,
        unpublishedBy: userId,
      },
    });
  } catch {
    // Ignore audit log persistence errors
  }

  return {
    success: true,
    electionId: election.id,
    status: 'ended',
    unpublishedAt,
    unpublishedBy: userId,
  };
}
