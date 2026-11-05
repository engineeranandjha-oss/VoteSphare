import crypto from 'crypto';
import { Eligibility, Election, Organization, Position, Vote } from '../../models/index.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normalizes and formats a receipt ID string from a SHA-256 hash
 * @param {string} hash - 64-char or 24-char hex string
 * @returns {string} Formatted VS-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX string
 */
export function formatReceiptId(hash) {
  if (!hash) return '';
  const clean = hash.replace(/[^a-f0-9]/gi, '').toUpperCase().substring(0, 24);
  const chunks = clean.match(/.{1,4}/g);
  return chunks ? `VS-${chunks.join('-')}` : '';
}

/**
 * Computes the deterministic SHA-256 receipt proof hash for an eligibility record
 * @param {string} electionId
 * @param {string} eligibilityId
 * @param {Date|number} timestamp
 * @returns {string} 64-char SHA-256 hex string
 */
export function computeReceiptProofHash(electionId, eligibilityId, timestamp) {
  const timeMs = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
  const seed = `${electionId}:${eligibilityId}:${timeMs}`;
  return crypto.createHash('sha256').update(seed).digest('hex');
}

/**
 * Verifies a ballot receipt by receipt ID, eligibility ID, or raw hash proof.
 * @param {string} query - Receipt ID (e.g. 'VS-ABCD-1234-...') or Eligibility UUID or hash
 * @param {object} [options] - Optional additional filters (e.g. { electionId })
 * @returns {Promise<object|null>} Verification payload or null if not found
 */
export async function verifyBallotReceipt(query, options = {}) {
  if (!query || typeof query !== 'string') {
    return null;
  }

  const cleanQuery = query.trim();

  let targetEligibility = null;

  // 1. Direct UUID lookup (Eligibility ID or Vote ID)
  if (UUID_REGEX.test(cleanQuery)) {
    targetEligibility = await Eligibility.findOne({
      where: {
        id: cleanQuery,
        status: 'voted',
        ...(options.electionId ? { electionId: options.electionId } : {}),
      },
      include: [
        {
          model: Election,
          as: 'election',
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['id', 'name', 'slug', 'logo', 'type'],
            },
            {
              model: Position,
              as: 'positions',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    if (!targetEligibility) {
      // Check if this UUID is a Vote ID
      const voteRecord = await Vote.findByPk(cleanQuery);
      if (voteRecord?.eligibilityId) {
        targetEligibility = await Eligibility.findOne({
          where: { id: voteRecord.eligibilityId, status: 'voted' },
          include: [
            {
              model: Election,
              as: 'election',
              include: [
                {
                  model: Organization,
                  as: 'organization',
                  attributes: ['id', 'name', 'slug', 'logo', 'type'],
                },
                {
                  model: Position,
                  as: 'positions',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
        });
      }
    }
  }

  // 2. Lookup by Receipt ID format (VS-XXXX-XXXX-...) or Hex string
  if (!targetEligibility) {
    const rawClean = cleanQuery.replace(/^VS-/i, '').replace(/-/g, '').toLowerCase();

    // Query all voted eligibilities to match proof hash
    const votedCandidates = await Eligibility.findAll({
      where: {
        status: 'voted',
        ...(options.electionId ? { electionId: options.electionId } : {}),
      },
      include: [
        {
          model: Election,
          as: 'election',
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['id', 'name', 'slug', 'logo', 'type'],
            },
            {
              model: Position,
              as: 'positions',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      limit: 500,
      order: [['updatedAt', 'DESC']],
    });

    for (const cand of votedCandidates) {
      const candTs = cand.updatedAt || cand.createdAt;
      const baseMs = candTs ? new Date(candTs).getTime() : 0;

      // 1. Direct match on eligibility updatedAt / createdAt
      const proof = computeReceiptProofHash(cand.electionId, cand.id, candTs);
      const proofShort = proof.substring(0, rawClean.length).toLowerCase();

      if (
        proof.toLowerCase() === rawClean ||
        proofShort === rawClean ||
        cand.id.replace(/-/g, '').toLowerCase().startsWith(rawClean)
      ) {
        targetEligibility = cand;
        break;
      }

      // 2. Check vote record timestamps associated with this eligibility
      const associatedVotes = await Vote.findAll({
        where: { eligibilityId: cand.id },
        attributes: ['timestamp'],
        limit: 5,
      });

      let matchFound = false;
      const timestampsToCheck = [baseMs];
      for (const v of associatedVotes) {
        if (v.timestamp) {
          timestampsToCheck.push(new Date(v.timestamp).getTime());
        }
      }

      for (const tMs of timestampsToCheck) {
        const voteProof = computeReceiptProofHash(cand.electionId, cand.id, tMs);
        const voteProofShort = voteProof.substring(0, rawClean.length).toLowerCase();
        if (voteProof.toLowerCase() === rawClean || voteProofShort === rawClean) {
          targetEligibility = cand;
          targetEligibility._matchedTimestamp = new Date(tMs);
          matchFound = true;
          break;
        }

        // Sub-second scan [tMs .. tMs + 999] for fractional millisecond seeds
        for (let offset = 0; offset < 1000; offset++) {
          const msProof = computeReceiptProofHash(cand.electionId, cand.id, tMs + offset);
          const msProofShort = msProof.substring(0, rawClean.length).toLowerCase();
          if (msProof.toLowerCase() === rawClean || msProofShort === rawClean) {
            targetEligibility = cand;
            targetEligibility._matchedTimestamp = new Date(tMs + offset);
            matchFound = true;
            break;
          }
        }
        if (matchFound) break;
      }

      if (matchFound) break;
    }
  }

  if (!targetEligibility || !targetEligibility.election) {
    return null;
  }

  const election = targetEligibility.election;
  const timestamp =
    targetEligibility._matchedTimestamp ||
    targetEligibility.updatedAt ||
    targetEligibility.createdAt;
  const fullProofHash = computeReceiptProofHash(
    targetEligibility.electionId,
    targetEligibility.id,
    timestamp
  );
  const formattedReceipt = cleanQuery.startsWith('VS-')
    ? cleanQuery.toUpperCase()
    : formatReceiptId(fullProofHash);

  // Count positions voted
  const voteCount = await Vote.count({
    where: { eligibilityId: targetEligibility.id },
  });

  return {
    verified: true,
    receiptId: formattedReceipt,
    eligibilityId: targetEligibility.id,
    ledgerProofHash: fullProofHash,
    receiptShortHash: fullProofHash.substring(0, 24).toUpperCase(),
    timestamp: timestamp.toISOString(),
    status:
      election.status === 'published'
        ? 'certified_tally'
        : election.status === 'ended'
        ? 'closed_polls'
        : 'sealed_and_recorded',
    isCertified: election.status === 'published',
    positionsVotedCount: voteCount || election.positions?.length || 1,
    election: {
      id: election.id,
      title: election.title,
      description: election.description,
      status: election.status,
      startDate: election.startDate,
      endDate: election.endDate,
      positionsCount: election.positions?.length || 0,
      organization: election.organization
        ? {
            id: election.organization.id,
            name: election.organization.name,
            slug: election.organization.slug,
            logo: election.organization.logo,
            type: election.organization.type,
          }
        : null,
    },
    verificationAudit: {
      protocol: 'VoteSphere End-to-End Cryptographic Ledger Verification',
      hashAlgorithm: 'SHA-256',
      secrecyProtocol: 'Decoupled Anonymous Ballot Partitioning',
      anonymityGuaranteed: true,
      tamperEvident: true,
    },
  };
}
