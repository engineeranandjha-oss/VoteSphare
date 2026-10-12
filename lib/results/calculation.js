import { Election, Position, Candidate, Vote, Eligibility } from '../../models/index.js';
import { NotFoundError } from '../utils/error-handler.js';

/**
 * Calculates voter turnout statistics for an election.
 *
 * @param {string} electionId - Election UUID
 * @returns {Promise<{
 *   totalEligible: number,
 *   totalVoted: number,
 *   turnoutPercentage: number,
 *   disqualifiedCount: number
 * }>}
 */
export async function calculateTurnout(electionId) {
  const totalEligible = await Eligibility.count({
    where: { electionId },
  });

  const totalVoted = await Eligibility.count({
    where: { electionId, status: 'voted' },
  });

  const disqualifiedCount = await Eligibility.count({
    where: { electionId, status: 'disqualified' },
  });

  const turnoutPercentage =
    totalEligible > 0 ? Number(((totalVoted / totalEligible) * 100).toFixed(2)) : 0;

  return {
    totalEligible,
    totalVoted,
    turnoutPercentage,
    disqualifiedCount,
  };
}

/**
 * Computes deep turnout metrics including position participation rates and quorum assessment.
 *
 * @param {string} electionId - Election UUID
 * @returns {Promise<{
 *   electionId: string,
 *   electionTitle: string,
 *   status: string,
 *   totalEligible: number,
 *   totalVoted: number,
 *   remainingCount: number,
 *   disqualifiedCount: number,
 *   turnoutPercentage: number,
 *   quorum: { targetPercentage: number, requiredVotes: number, isMet: boolean, deficit: number },
 *   positionParticipation: Array<{ positionId: string, positionName: string, votesCast: number, participationRate: number }>,
 *   calculatedAt: string
 * }>}
 */
export async function calculateDetailedTurnout(electionId) {
  const election = await Election.findByPk(electionId, {
    attributes: ['id', 'title', 'status', 'config', 'startDate', 'endDate'],
    include: [
      {
        model: Position,
        as: 'positions',
        attributes: ['id', 'name', 'order'],
      },
    ],
  });

  if (!election) {
    throw new NotFoundError('Election not found');
  }

  const basicTurnout = await calculateTurnout(electionId);
  const totalEligible = basicTurnout.totalEligible;
  const totalVoted = basicTurnout.totalVoted;
  const disqualifiedCount = basicTurnout.disqualifiedCount;
  const remainingCount = Math.max(0, totalEligible - totalVoted - disqualifiedCount);

  // Quorum evaluation
  const quorumTarget = election.config?.quorumPercentage || 0;
  const quorumMet = quorumTarget > 0 ? basicTurnout.turnoutPercentage >= quorumTarget : true;
  const quorumVotesRequired = quorumTarget > 0 ? Math.ceil((totalEligible * quorumTarget) / 100) : 0;

  // Position-level participation
  const votes = await Vote.findAll({
    where: { electionId },
    attributes: ['positionId'],
  });

  const positionVoteCounts = new Map();
  for (const v of votes) {
    positionVoteCounts.set(v.positionId, (positionVoteCounts.get(v.positionId) || 0) + 1);
  }

  const positionParticipation = (election.positions || []).map((pos) => {
    const cast = positionVoteCounts.get(pos.id) || 0;
    const rate = totalEligible > 0 ? Number(((cast / totalEligible) * 100).toFixed(2)) : 0;
    return {
      positionId: pos.id,
      positionName: pos.name,
      votesCast: cast,
      participationRate: rate,
    };
  });

  return {
    electionId: election.id,
    electionTitle: election.title,
    status: election.status,
    totalEligible,
    totalVoted,
    remainingCount,
    disqualifiedCount,
    turnoutPercentage: basicTurnout.turnoutPercentage,
    quorum: {
      targetPercentage: quorumTarget,
      requiredVotes: quorumVotesRequired,
      isMet: quorumMet,
      deficit: quorumMet ? 0 : Math.max(0, quorumVotesRequired - totalVoted),
    },
    positionParticipation,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Evaluates candidates for a position to determine the winner(s), identify ties, check majority/thresholds,
 * and calculate victory margins.
 *
 * @param {Array<{ id: string, name: string, voteCount: number, percentage?: number }>} candidatesWithVotes
 * @param {object} [options={}]
 * @param {'plurality' | 'absolute_majority' | 'threshold'} [options.rule='plurality']
 * @param {number} [options.thresholdPercentage=50]
 * @param {number} [options.seats=1]
 * @param {number} [options.totalVotes]
 * @returns {{
 *   status: 'decided' | 'tie' | 'no_majority' | 'below_threshold' | 'no_votes' | 'uncontested',
 *   winner: object | null,
 *   winners: Array<object>,
 *   isTie: boolean,
 *   leadingVoteCount: number,
 *   tiedCandidates: Array<object>,
 *   runnerUps: Array<object>,
 *   marginVotes: number,
 *   marginPercentage: number,
 *   requiresRunoff: boolean,
 *   runoffCandidates: Array<object>,
 *   seatsAvailable: number
 * }}
 */
export function determineWinner(candidatesWithVotes = [], options = {}) {
  const rule = options.rule || 'plurality';
  const thresholdPercentage = options.thresholdPercentage !== undefined ? options.thresholdPercentage : 50;
  const seats = Math.max(1, options.seats || 1);

  if (!candidatesWithVotes || candidatesWithVotes.length === 0) {
    return {
      status: 'no_votes',
      winner: null,
      winners: [],
      isTie: false,
      leadingVoteCount: 0,
      tiedCandidates: [],
      runnerUps: [],
      marginVotes: 0,
      marginPercentage: 0,
      requiresRunoff: false,
      runoffCandidates: [],
      seatsAvailable: seats,
    };
  }

  // Calculate total votes if not provided
  const totalVotes =
    options.totalVotes !== undefined
      ? options.totalVotes
      : candidatesWithVotes.reduce((sum, c) => sum + (c.voteCount || 0), 0);

  // Normalize candidate array with percentages
  const candidates = candidatesWithVotes.map((c) => ({
    ...c,
    voteCount: c.voteCount || 0,
    percentage:
      c.percentage !== undefined
        ? c.percentage
        : totalVotes > 0
          ? Number((((c.voteCount || 0) / totalVotes) * 100).toFixed(2))
          : 0,
  }));

  // Sort descending by voteCount, then alphabetically by name
  candidates.sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount;
    }
    return a.name.localeCompare(b.name);
  });

  const maxVotes = candidates[0].voteCount;

  // Case: No votes cast across all candidates
  if (maxVotes === 0) {
    return {
      status: 'no_votes',
      winner: null,
      winners: [],
      isTie: false,
      leadingVoteCount: 0,
      tiedCandidates: [],
      runnerUps: [],
      marginVotes: 0,
      marginPercentage: 0,
      requiresRunoff: false,
      runoffCandidates: [],
      seatsAvailable: seats,
    };
  }

  // Case: Uncontested (Single candidate with votes)
  if (candidates.length === 1 && seats === 1) {
    return {
      status: 'uncontested',
      winner: candidates[0],
      winners: [candidates[0]],
      isTie: false,
      leadingVoteCount: maxVotes,
      tiedCandidates: [],
      runnerUps: [],
      marginVotes: maxVotes,
      marginPercentage: candidates[0].percentage,
      requiresRunoff: false,
      runoffCandidates: [],
      seatsAvailable: seats,
    };
  }

  // SINGLE-SEAT ELECTION (seats === 1)
  if (seats === 1) {
    const topCandidate = candidates[0];
    const secondCandidate = candidates[1] || null;

    // Check for exact tie for 1st place
    const tiedForFirst = candidates.filter((c) => c.voteCount === maxVotes);
    if (tiedForFirst.length > 1) {
      return {
        status: 'tie',
        winner: null,
        winners: [],
        isTie: true,
        leadingVoteCount: maxVotes,
        tiedCandidates: tiedForFirst,
        runnerUps: candidates.filter((c) => c.voteCount < maxVotes),
        marginVotes: 0,
        marginPercentage: 0,
        requiresRunoff: true,
        runoffCandidates: tiedForFirst,
        seatsAvailable: seats,
      };
    }

    const marginVotes = secondCandidate ? topCandidate.voteCount - secondCandidate.voteCount : topCandidate.voteCount;
    const marginPercentage = secondCandidate
      ? Number((topCandidate.percentage - secondCandidate.percentage).toFixed(2))
      : topCandidate.percentage;

    // Rule: Absolute Majority (> 50% of valid votes cast)
    if (rule === 'absolute_majority') {
      const majorityTarget = 50.0;
      if (topCandidate.percentage > majorityTarget) {
        return {
          status: 'decided',
          winner: topCandidate,
          winners: [topCandidate],
          isTie: false,
          leadingVoteCount: maxVotes,
          tiedCandidates: [],
          runnerUps: candidates.slice(1),
          marginVotes,
          marginPercentage,
          requiresRunoff: false,
          runoffCandidates: [],
          seatsAvailable: seats,
        };
      }
      return {
        status: 'no_majority',
        winner: null,
        winners: [],
        isTie: false,
        leadingVoteCount: maxVotes,
        tiedCandidates: [],
        runnerUps: candidates.slice(1),
        marginVotes,
        marginPercentage,
        requiresRunoff: true,
        runoffCandidates: candidates.slice(0, 2),
        seatsAvailable: seats,
      };
    }

    // Rule: Configurable Threshold (e.g. 60% supermajority)
    if (rule === 'threshold') {
      if (topCandidate.percentage >= thresholdPercentage) {
        return {
          status: 'decided',
          winner: topCandidate,
          winners: [topCandidate],
          isTie: false,
          leadingVoteCount: maxVotes,
          tiedCandidates: [],
          runnerUps: candidates.slice(1),
          marginVotes,
          marginPercentage,
          requiresRunoff: false,
          runoffCandidates: [],
          seatsAvailable: seats,
        };
      }
      return {
        status: 'below_threshold',
        winner: null,
        winners: [],
        isTie: false,
        leadingVoteCount: maxVotes,
        tiedCandidates: [],
        runnerUps: candidates.slice(1),
        marginVotes,
        marginPercentage,
        requiresRunoff: true,
        runoffCandidates: candidates.slice(0, 2),
        seatsAvailable: seats,
      };
    }

    // Default Rule: Plurality (First-Past-The-Post)
    return {
      status: 'decided',
      winner: topCandidate,
      winners: [topCandidate],
      isTie: false,
      leadingVoteCount: maxVotes,
      tiedCandidates: [],
      runnerUps: candidates.slice(1),
      marginVotes,
      marginPercentage,
      requiresRunoff: false,
      runoffCandidates: [],
      seatsAvailable: seats,
    };
  }

  // MULTI-SEAT ELECTION (seats > 1)
  const validCandidates = candidates.filter((c) => c.voteCount > 0);
  if (validCandidates.length <= seats) {
    // All candidates with votes win a seat
    return {
      status: 'decided',
      winner: validCandidates[0] || null,
      winners: validCandidates,
      isTie: false,
      leadingVoteCount: maxVotes,
      tiedCandidates: [],
      runnerUps: candidates.slice(validCandidates.length),
      marginVotes: 0,
      marginPercentage: 0,
      requiresRunoff: false,
      runoffCandidates: [],
      seatsAvailable: seats,
    };
  }

  // Check cutoff point at the boundary of available seats
  const cutoffScore = validCandidates[seats - 1].voteCount;
  const nextScore = validCandidates[seats] ? validCandidates[seats].voteCount : 0;

  if (cutoffScore === nextScore) {
    // There is a tie at the boundary of the final available seat(s)
    const tiedAtBoundary = validCandidates.filter((c) => c.voteCount === cutoffScore);
    const clearWinners = validCandidates.filter((c) => c.voteCount > cutoffScore);

    return {
      status: 'tie',
      winner: clearWinners[0] || null,
      winners: clearWinners,
      isTie: true,
      leadingVoteCount: maxVotes,
      tiedCandidates: tiedAtBoundary,
      runnerUps: validCandidates.filter((c) => c.voteCount < cutoffScore),
      marginVotes: 0,
      marginPercentage: 0,
      requiresRunoff: true,
      runoffCandidates: tiedAtBoundary,
      seatsAvailable: seats,
    };
  }

  // Clear top N winners
  const winners = validCandidates.slice(0, seats);
  const runnerUps = validCandidates.slice(seats);
  const lowestWinner = winners[winners.length - 1];
  const firstRunnerUp = runnerUps[0];
  const marginVotes = lowestWinner.voteCount - (firstRunnerUp ? firstRunnerUp.voteCount : 0);
  const marginPercentage = firstRunnerUp
    ? Number((lowestWinner.percentage - firstRunnerUp.percentage).toFixed(2))
    : lowestWinner.percentage;

  return {
    status: 'decided',
    winner: winners[0],
    winners,
    isTie: false,
    leadingVoteCount: maxVotes,
    tiedCandidates: [],
    runnerUps,
    marginVotes,
    marginPercentage,
    requiresRunoff: false,
    runoffCandidates: [],
    seatsAvailable: seats,
  };
}

/**
 * Computes results, vote shares, rankings, and winner determination for a single electoral position.
 *
 * @param {object} position - Position model or object with candidates array
 * @param {Array<object>} [positionVotes] - Array of Vote objects for this position
 * @param {object} [options={}] - Calculation options (rule, thresholdPercentage, seats)
 * @returns {{
 *   positionId: string,
 *   positionName: string,
 *   positionDescription: string | null,
 *   positionOrder: number,
 *   totalVotes: number,
 *   status: string,
 *   winner: object | null,
 *   winners: Array<object>,
 *   isTie: boolean,
 *   tiedCandidates: Array<object>,
 *   marginVotes: number,
 *   marginPercentage: number,
 *   candidates: Array<object>
 * }}
 */
export function calculatePositionResults(position, positionVotes = [], options = {}) {
  const plainPos = typeof position.get === 'function' ? position.get({ plain: true }) : position;
  const candidates = plainPos.candidates || [];

  // Count votes per candidate
  const voteCounts = new Map();
  for (const vote of positionVotes) {
    const cid = vote.candidateId;
    voteCounts.set(cid, (voteCounts.get(cid) || 0) + 1);
  }

  const totalVotes = positionVotes.length;

  const candidateResults = candidates.map((cand) => {
    const plainCand = typeof cand.get === 'function' ? cand.get({ plain: true }) : cand;
    const count = voteCounts.get(plainCand.id) || 0;
    const percentage = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(2)) : 0;

    return {
      id: plainCand.id,
      name: plainCand.name,
      photo: plainCand.photo || null,
      bio: plainCand.bio || null,
      status: plainCand.status || 'active',
      voteCount: count,
      percentage,
      isWinner: false,
    };
  });

  const seats = options.seats || plainPos.maxSelections || 1;
  const winnerEvaluation = determineWinner(candidateResults, {
    rule: options.rule || 'plurality',
    thresholdPercentage: options.thresholdPercentage,
    seats,
    totalVotes,
  });

  const winnerIds = new Set((winnerEvaluation.winners || []).map((w) => w.id));
  const tiedIds = new Set((winnerEvaluation.tiedCandidates || []).map((t) => t.id));
  for (const c of candidateResults) {
    if (winnerIds.has(c.id)) {
      c.isWinner = true;
    }
    if (tiedIds.has(c.id)) {
      c.isTied = true;
    }
  }

  // Sort candidates descending by vote count, then alphabetically by name
  candidateResults.sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    positionId: plainPos.id,
    positionName: plainPos.name,
    positionDescription: plainPos.description || null,
    positionOrder: plainPos.order || 0,
    totalVotes,
    status: winnerEvaluation.status,
    winner: winnerEvaluation.winner,
    winners: winnerEvaluation.winners,
    isTie: winnerEvaluation.isTie,
    tiedCandidates: winnerEvaluation.tiedCandidates,
    marginVotes: winnerEvaluation.marginVotes,
    marginPercentage: winnerEvaluation.marginPercentage,
    requiresRunoff: winnerEvaluation.requiresRunoff,
    runoffCandidates: winnerEvaluation.runoffCandidates,
    candidates: candidateResults,
  };
}

/**
 * Aggregates complete election tallies, position results, winners, and turnout metrics.
 *
 * @param {string} electionId - Election UUID
 * @returns {Promise<{
 *   electionId: string,
 *   electionTitle: string,
 *   status: string,
 *   calculatedAt: string,
 *   turnout: { totalEligible: number, totalVoted: number, turnoutPercentage: number, disqualifiedCount: number },
 *   totalVotesCast: number,
 *   positions: Array<object>
 * }>}
 */
export async function calculateResults(electionId) {
  const election = await Election.findByPk(electionId, {
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
    throw new NotFoundError('Election not found');
  }

  // Fetch all votes recorded for this election
  const votes = await Vote.findAll({
    where: { electionId },
    attributes: ['id', 'positionId', 'candidateId'],
  });

  // Calculate Turnout
  const turnout = await calculateTurnout(electionId);

  // Group votes by position
  const votesByPosition = new Map();
  for (const vote of votes) {
    const pid = vote.positionId;
    if (!votesByPosition.has(pid)) {
      votesByPosition.set(pid, []);
    }
    votesByPosition.get(pid).push(vote);
  }

  const positions = (election.positions || []).map((pos) => {
    const pVotes = votesByPosition.get(pos.id) || [];
    return calculatePositionResults(pos, pVotes, {
      rule: election.config?.winningRule || 'plurality',
      thresholdPercentage: election.config?.majorityThreshold,
      seats: pos.maxSelections || 1,
    });
  });

  const hasRunoffsRequired = positions.some((p) => p.requiresRunoff);
  const hasTies = positions.some((p) => p.isTie);
  const isFullyDecided = positions.length > 0 && positions.every((p) => p.status === 'decided' || p.status === 'uncontested');

  return {
    electionId: election.id,
    orgId: election.orgId,
    electionTitle: election.title,
    status: election.status,
    config: election.config || {},
    hasRunoffsRequired,
    hasTies,
    isFullyDecided,
    calculatedAt: new Date().toISOString(),
    turnout,
    totalVotesCast: votes.length,
    positions,
  };
}

/**
 * Determines and certifies the winners for all positions in an election.
 *
 * @param {string} electionId - Election UUID
 * @returns {Promise<{
 *   electionId: string,
 *   electionTitle: string,
 *   status: string,
 *   winningRule: string,
 *   isFullyDecided: boolean,
 *   hasTies: boolean,
 *   hasRunoffsRequired: boolean,
 *   positionSummary: {
 *     total: number,
 *     decided: number,
 *     tied: number,
 *     unresolved: number
 *   },
 *   positions: Array<{
 *     positionId: string,
 *     positionName: string,
 *     seatsAvailable: number,
 *     status: string,
 *     totalVotes: number,
 *     winners: Array<object>,
 *     runnerUps: Array<object>,
 *     tiedCandidates: Array<object>,
 *     marginVotes: number,
 *     marginPercentage: number,
 *     requiresRunoff: boolean,
 *     runoffCandidates: Array<object>
 *   }>,
 *   certifiedAt: string
 * }>}
 */
export async function determineElectionWinners(electionId) {
  const election = await Election.findByPk(electionId, {
    attributes: ['id', 'title', 'status', 'config'],
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
    throw new NotFoundError('Election not found');
  }

  const votes = await Vote.findAll({
    where: { electionId },
    attributes: ['id', 'positionId', 'candidateId'],
  });

  const votesByPosition = new Map();
  for (const vote of votes) {
    const pid = vote.positionId;
    if (!votesByPosition.has(pid)) {
      votesByPosition.set(pid, []);
    }
    votesByPosition.get(pid).push(vote);
  }

  const winningRule = election.config?.winningRule || 'plurality';
  const thresholdPercentage = election.config?.majorityThreshold;

  let decidedCount = 0;
  let tieCount = 0;
  let unresolvedCount = 0;

  const positionsResult = (election.positions || []).map((pos) => {
    const pVotes = votesByPosition.get(pos.id) || [];
    const seats = pos.maxSelections || 1;
    const res = calculatePositionResults(pos, pVotes, {
      rule: winningRule,
      thresholdPercentage,
      seats,
    });

    if (res.status === 'decided' || res.status === 'uncontested') {
      decidedCount++;
    } else if (res.isTie) {
      tieCount++;
      unresolvedCount++;
    } else {
      unresolvedCount++;
    }

    return {
      positionId: res.positionId,
      positionName: res.positionName,
      seatsAvailable: seats,
      status: res.status,
      totalVotes: res.totalVotes,
      winners: res.winners,
      runnerUps: res.candidates.filter((c) => !c.isWinner),
      tiedCandidates: res.tiedCandidates,
      marginVotes: res.marginVotes,
      marginPercentage: res.marginPercentage,
      requiresRunoff: res.requiresRunoff,
      runoffCandidates: res.runoffCandidates || [],
    };
  });

  const totalPositions = positionsResult.length;
  const isFullyDecided = totalPositions > 0 && decidedCount === totalPositions;

  return {
    electionId: election.id,
    electionTitle: election.title,
    status: election.status,
    winningRule,
    isFullyDecided,
    hasTies: tieCount > 0,
    hasRunoffsRequired: unresolvedCount > 0,
    positionSummary: {
      total: totalPositions,
      decided: decidedCount,
      tied: tieCount,
      unresolved: unresolvedCount,
    },
    positions: positionsResult,
    certifiedAt: new Date().toISOString(),
  };
}
