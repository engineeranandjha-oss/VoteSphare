import { Op } from 'sequelize';
import { Election, Position, Candidate, AuditLog } from '../../models/index.js';
import { ValidationError, NotFoundError } from '../utils/error-handler.js';
import { assertCanLaunchElection } from '../billing/entitlements.js';

/**
 * Valid state transitions for an Election
 */
export const ALLOWED_TRANSITIONS = {
  draft: ['scheduled', 'live', 'archived'],
  scheduled: ['draft', 'live', 'archived'],
  live: ['ended'],
  ended: ['published', 'archived'],
  published: ['ended', 'archived'],
  archived: [],
};

/**
 * Check if a status transition is permissible according to the state machine
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
export function canTransition(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) {
    return false;
  }
  if (currentStatus === newStatus) {
    return true;
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Validates that an election has necessary setup to be scheduled or go live.
 *
 * @param {string} electionId - Election UUID
 * @throws {ValidationError | NotFoundError}
 * @returns {Promise<{ valid: boolean, positionCount: number, candidateCount: number }>}
 */
export async function validateElectionReadiness(electionId) {
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
  });

  if (!election) {
    throw new NotFoundError('Election not found');
  }

  if (!election.positions || election.positions.length === 0) {
    throw new ValidationError('Election must have at least one position configured before going live');
  }

  let totalCandidates = 0;
  for (const pos of election.positions) {
    const activeCandidates = pos.candidates || [];
    totalCandidates += activeCandidates.length;
    if (activeCandidates.length === 0) {
      throw new ValidationError(`Position "${pos.name}" must have at least one active candidate`);
    }
  }

  if (election.startDate && election.endDate) {
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);
    if (end <= start) {
      throw new ValidationError('Election end date must be after the start date');
    }
  }

  return {
    valid: true,
    positionCount: election.positions.length,
    candidateCount: totalCandidates,
  };
}

/**
 * Executes a status transition for an election with validation and audit logging.
 *
 * @param {string} electionId - Election UUID
 * @param {string} newStatus - Target status
 * @param {string} [actorId] - User UUID initiating transition
 * @returns {Promise<import('@/models/election.js').Election>}
 */
export async function transitionElection(electionId, newStatus, actorId = null) {
  const election = await Election.findByPk(electionId);

  if (!election) {
    throw new NotFoundError('Election not found');
  }

  const currentStatus = election.status;

  if (currentStatus === newStatus) {
    return election;
  }

  if (!canTransition(currentStatus, newStatus)) {
    throw new ValidationError(
      `Cannot transition election status from '${currentStatus}' to '${newStatus}'`
    );
  }

  // Pre-transition validation when launching or scheduling
  if (newStatus === 'scheduled' || newStatus === 'live') {
    await validateElectionReadiness(electionId);
    await assertCanLaunchElection(election.orgId, election.id);
  }

  // Auto-set start date if going live immediately without pre-set date
  if (newStatus === 'live' && !election.startDate) {
    election.startDate = new Date();
  }

  // Auto-set end date if ending without pre-set date
  if (newStatus === 'ended' && !election.endDate) {
    election.endDate = new Date();
  }

  election.status = newStatus;
  await election.save();

  // Audit log entry
  try {
    await AuditLog.create({
      orgId: election.orgId,
      userId: actorId,
      action: 'ELECTION_STATUS_CHANGE',
      entityType: 'election',
      entityId: election.id,
      metadata: {
        previousStatus: currentStatus,
        newStatus,
      },
    });
  } catch {
    // Ignore audit log write failure to not interrupt transaction
  }

  return election;
}

/**
 * Background auto-transition worker for time-based status updates
 * - SCHEDULED -> LIVE (when startDate <= now and endDate > now)
 * - LIVE -> ENDED (when endDate <= now)
 *
 * @returns {Promise<{ transitionedToLive: number, transitionedToEnded: number, errors: Array<{ electionId: string, error: string }> }>}
 */
export async function autoTransitionElections() {
  const now = new Date();
  const summary = {
    transitionedToLive: 0,
    transitionedToEnded: 0,
    errors: [],
  };

  // 1. Scheduled -> Live
  const scheduledElections = await Election.findAll({
    where: {
      status: 'scheduled',
      startDate: {
        [Op.lte]: now,
      },
      [Op.or]: [
        { endDate: null },
        { endDate: { [Op.gt]: now } },
      ],
    },
  });

  for (const election of scheduledElections) {
    try {
      await transitionElection(election.id, 'live');
      summary.transitionedToLive += 1;
    } catch (err) {
      summary.errors.push({
        electionId: election.id,
        error: err.message || 'Error transitioning to live',
      });
    }
  }

  // 2. Live -> Ended
  const liveElections = await Election.findAll({
    where: {
      status: 'live',
      endDate: {
        [Op.lte]: now,
      },
    },
  });

  for (const election of liveElections) {
    try {
      await transitionElection(election.id, 'ended');
      summary.transitionedToEnded += 1;
    } catch (err) {
      summary.errors.push({
        electionId: election.id,
        error: err.message || 'Error transitioning to ended',
      });
    }
  }

  return summary;
}
