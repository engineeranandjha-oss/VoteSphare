import { Election, Position, Candidate, Eligibility, AuditLog } from '../../models/index.js';
import { determineElectionWinners, calculateTurnout } from '../results/calculation.js';
import { ValidationError, NotFoundError } from '../utils/error-handler.js';

/**
 * Retrieves runoff eligibility preview, candidate rosters, and existing linked child runoff info.
 *
 * @param {string} electionId - Parent Election UUID
 * @returns {Promise<{
 *   canCreateRunoff: boolean,
 *   parentElection: { id: string, title: string, status: string, orgId: string, round: number },
 *   targetRound: number,
 *   hasRunoffsRequired: boolean,
 *   hasTies: boolean,
 *   votingRule: string,
 *   totalEligibleVoters: number,
 *   childElection: object | null,
 *   positionsToRunoff: Array<{
 *     positionId: string,
 *     positionName: string,
 *     positionDescription: string | null,
 *     positionOrder: number,
 *     seatsAvailable: number,
 *     status: string,
 *     totalVotes: number,
 *     runoffCandidates: Array<{ id: string, name: string, voteCount: number, percentage: number, photo: string | null, bio: string | null }>
 *   }>
 * }>}
 */
export async function getRunoffPreview(electionId) {
  const election = await Election.findByPk(electionId, {
    attributes: ['id', 'title', 'status', 'orgId', 'config', 'startDate', 'endDate'],
    include: [
      {
        model: Position,
        as: 'positions',
        include: [
          {
            model: Candidate,
            as: 'candidates',
          },
        ],
      },
    ],
    order: [[{ model: Position, as: 'positions' }, 'order', 'ASC']],
  });

  if (!election) {
    throw new NotFoundError('Parent election not found');
  }

  const [winnersData, turnout] = await Promise.all([
    determineElectionWinners(electionId),
    calculateTurnout(electionId),
  ]);

  const parentRound = election.config?.runoff?.round || 1;
  const targetRound = parentRound + 1;
  const childElectionId = election.config?.runoff?.childElectionId;

  let childElection = null;
  if (childElectionId) {
    const child = await Election.findByPk(childElectionId, {
      attributes: ['id', 'title', 'status', 'orgId', 'config', 'startDate', 'endDate'],
    });
    if (child) {
      childElection = {
        id: child.id,
        title: child.title,
        status: child.status,
        orgId: child.orgId,
        round: child.config?.runoff?.round || targetRound,
      };
    }
  }

  // Filter positions that strictly require a runoff
  const positionsToRunoff = winnersData.positions
    .filter((pos) => pos.requiresRunoff)
    .map((pos) => {
      const origPos = (election.positions || []).find((p) => p.id === pos.positionId);
      return {
        positionId: pos.positionId,
        positionName: pos.positionName,
        positionDescription: origPos?.description || null,
        positionOrder: origPos?.order || 0,
        seatsAvailable: pos.seatsAvailable || 1,
        status: pos.status,
        totalVotes: pos.totalVotes,
        runoffCandidates: pos.runoffCandidates || [],
      };
    });

  const isConcluded =
    election.status === 'ended' || election.status === 'published' || election.status === 'archived';

  const canCreateRunoff = Boolean(!childElection && winnersData.hasRunoffsRequired && isConcluded);

  return {
    canCreateRunoff,
    parentElection: {
      id: election.id,
      title: election.title,
      status: election.status,
      orgId: election.orgId,
      round: parentRound,
    },
    targetRound,
    hasRunoffsRequired: winnersData.hasRunoffsRequired,
    hasTies: winnersData.hasTies,
    votingRule: winnersData.winningRule,
    totalEligibleVoters: turnout.totalEligible,
    childElection,
    positionsToRunoff,
  };
}

/**
 * Creates and launches a linked runoff election based on authoritative server results.
 * Preserves the parent election as strictly immutable Round 1.
 *
 * @param {object} params
 * @param {string} params.parentElectionId - Original/Parent election UUID
 * @param {string} params.userId - Administrator UUID creating the runoff
 * @param {boolean} [params.startImmediately=false] - Whether to set status to 'live' immediately
 * @param {string} [params.customTitle] - Optional custom title for the runoff round
 * @param {Date|string} [params.startDate] - Scheduled start date if not starting immediately
 * @param {Date|string} [params.endDate] - End date for runoff polling
 * @returns {Promise<{
 *   success: boolean,
 *   runoffElection: object,
 *   positionsCreated: number,
 *   candidatesCreated: number,
 *   votersEnrolled: number
 * }>}
 */
export async function createRunoffElection({
  parentElectionId,
  userId,
  startImmediately = false,
  customTitle = null,
  startDate = null,
  endDate = null,
}) {
  const parentElection = await Election.findByPk(parentElectionId, {
    include: [
      {
        model: Position,
        as: 'positions',
        include: [
          {
            model: Candidate,
            as: 'candidates',
          },
        ],
      },
    ],
  });

  if (!parentElection) {
    throw new NotFoundError('Parent election not found');
  }

  // Parent election must be in a concluded state (ended, published, or archived).
  // Live or draft elections cannot spawn runoffs without explicit formal conclusion.
  const isConcluded =
    parentElection.status === 'ended' ||
    parentElection.status === 'published' ||
    parentElection.status === 'archived';

  if (!isConcluded) {
    throw new ValidationError(
      `Cannot create a runoff from an election in '${parentElection.status}' status. The election must be concluded ('ended', 'published', or 'archived') first.`
    );
  }

  // Authoritative server-side winner evaluation
  const winnersData = await determineElectionWinners(parentElectionId);

  if (!winnersData.hasRunoffsRequired) {
    throw new ValidationError(
      'This election does not require a runoff. All positions have definitive winners according to the election rules.'
    );
  }

  if (parentElection.config?.runoff?.childElectionId) {
    throw new ValidationError(
      'A runoff election has already been created for this election. Duplicate runoffs are prevented.'
    );
  }

  const parentRound = parentElection.config?.runoff?.round || 1;
  const newRound = parentRound + 1;
  const runoffTitle =
    (customTitle && customTitle.trim()) || `${parentElection.title} (Runoff Round ${newRound})`;

  // Filter positions requiring runoff
  const positionsToRunoff = winnersData.positions.filter((pos) => pos.requiresRunoff);
  if (positionsToRunoff.length === 0) {
    throw new ValidationError('No eligible positions found requiring a runoff');
  }

  // Initial status determination
  const initialStatus = startImmediately ? 'live' : startDate ? 'scheduled' : 'draft';

  // Build clean runoff config preserving institutional settings but resetting snapshots
  const runoffConfig = {
    ...(parentElection.config || {}),
    runoff: {
      parentElectionId: parentElection.id,
      parentElectionTitle: parentElection.title,
      originalElectionId: parentElection.config?.runoff?.originalElectionId || parentElection.id,
      round: newRound,
      isRunoff: true,
      sourceRunoffCertifiedAt: winnersData.certifiedAt || new Date().toISOString(),
    },
  };

  // Remove parent-specific publication snapshots
  delete runoffConfig.publishingDetails;
  delete runoffConfig.certifiedSnapshot;

  // 1. Create the new Runoff Election record
  const runoffElection = await Election.create({
    orgId: parentElection.orgId,
    title: runoffTitle,
    description: parentElection.description || null,
    status: initialStatus,
    startDate: startImmediately ? new Date() : startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    config: runoffConfig,
    createdBy: userId,
  });

  let candidatesCreatedCount = 0;

  // 2. Create Positions and Qualified Runoff Candidates
  for (const posResult of positionsToRunoff) {
    const origPos = (parentElection.positions || []).find((p) => p.id === posResult.positionId);

    const newPos = await Position.create({
      electionId: runoffElection.id,
      name: posResult.positionName,
      description: origPos?.description || null,
      order: origPos?.order || 0,
    });

    const origCandidatesMap = new Map();
    if (origPos && origPos.candidates) {
      origPos.candidates.forEach((c) => origCandidatesMap.set(c.id, c));
    }

    for (const candSummary of posResult.runoffCandidates) {
      const origCand = origCandidatesMap.get(candSummary.id);

      await Candidate.create({
        positionId: newPos.id,
        userId: origCand?.userId || null,
        name: candSummary.name,
        photo: origCand?.photo || null,
        bio: origCand?.bio || null,
        manifesto: origCand?.manifesto || null,
        socialLinks: origCand?.socialLinks || {},
        status: 'active',
      });
      candidatesCreatedCount++;
    }
  }

  // 3. Duplicate Voter Roster into Fresh Eligibility Records (Zero-vote state)
  const parentEligibilities = await Eligibility.findAll({
    where: { electionId: parentElection.id },
  });

  const freshEligibilities = parentEligibilities
    .filter((e) => e.status !== 'disqualified')
    .map((e) => ({
      electionId: runoffElection.id,
      memberId: e.memberId,
      status: 'eligible', // Fresh eligible status
    }));

  if (freshEligibilities.length > 0) {
    await Eligibility.bulkCreate(freshEligibilities);
  }

  // 4. Link child runoff to parent election configuration (Parent remains immutable Round 1)
  const updatedParentConfig = { ...(parentElection.config || {}) };
  updatedParentConfig.runoff = {
    ...(updatedParentConfig.runoff || {}),
    round: parentRound,
    childElectionId: runoffElection.id,
    childElectionTitle: runoffElection.title,
    childElectionStatus: runoffElection.status,
    linkedAt: new Date().toISOString(),
  };

  await parentElection.update({ config: updatedParentConfig });

  // 5. Append immutable Audit Log entry
  await AuditLog.create({
    orgId: parentElection.orgId,
    userId,
    action: 'election_runoff_created',
    entityType: 'Election',
    entityId: runoffElection.id,
    metadata: {
      parentElectionId: parentElection.id,
      parentElectionTitle: parentElection.title,
      runoffElectionId: runoffElection.id,
      round: newRound,
      positionsCount: positionsToRunoff.length,
      candidatesCount: candidatesCreatedCount,
      votersEnrolled: freshEligibilities.length,
      startImmediately,
    },
  });

  return {
    success: true,
    runoffElection: {
      id: runoffElection.id,
      orgId: runoffElection.orgId,
      title: runoffElection.title,
      status: runoffElection.status,
      round: newRound,
      parentElectionId: parentElection.id,
      config: runoffElection.config,
    },
    positionsCreated: positionsToRunoff.length,
    candidatesCreated: candidatesCreatedCount,
    votersEnrolled: freshEligibilities.length,
  };
}
