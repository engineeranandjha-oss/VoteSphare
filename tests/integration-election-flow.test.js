import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  organizationCreateSchema,
  electionCreateSchema,
  positionCreateSchema,
  candidateCreateSchema,
  voteCastSchema,
} from '../lib/validations/index.js';
import { canTransition } from '../lib/elections/lifecycle.js';
import {
  calculatePositionResults,
  determineWinner,
} from '../lib/results/calculation.js';
import { validateCanPublish } from '../lib/results/publishing.js';
import { sanitizeVotePayload, generateBlindHash } from '../lib/voting/anonymity.js';
import { verifyVotingSessionToken } from '../lib/voting/session.js';
import {
  computeReceiptProofHash,
  formatReceiptId,
} from '../lib/voting/verification.js';
import { generateShareableLinks } from '../lib/sharing/links.js';

function createMockSignedToken(payload, secret = process.env.INVITATION_SECRET || 'votesphere-voting-session-secret-key') {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  return `${payloadStr}.${signature}`;
}

describe('VoteSphere Full-System Integration Test Suite', () => {
  // Test Mock State across stages
  const orgPayload = {
    name: 'Metropolitan University Faculty Senate',
    slug: 'metro-faculty-senate',
    type: 'university',
    description: 'Official governing council for faculty and academic governance.',
  };

  const electionPayload = {
    title: 'Faculty Senate Executive Board Election 2026',
    description: 'Annual election for senate chairperson and board members.',
    config: {
      allowCandidateWithdrawal: true,
      requireVoterVerification: true,
      showLiveTurnout: true,
    },
  };

  const positionPresident = {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'Senate Chairperson',
    order: 1,
  };

  const candidateA = {
    id: '22222222-2222-4222-a222-222222222221',
    name: 'Dr. Eleanor Vance',
    manifesto: 'Focus on research grants and transparency.',
  };

  const candidateB = {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'Prof. Marcus Brody',
    manifesto: 'Focus on curriculum reform and student affairs.',
  };

  const electionId = '33333333-3333-4333-a333-333333333333';
  const memberId = '44444444-4444-4444-a444-444444444444';
  const eligibilityId = '55555555-5555-4555-a555-555555555555';

  describe('Stage 1: Organization, Election & Candidate Setup Integration', () => {
    test('successfully validates organization configuration', () => {
      const validatedOrg = organizationCreateSchema.parse(orgPayload);
      assert.equal(validatedOrg.name, 'Metropolitan University Faculty Senate');
      assert.equal(validatedOrg.slug, 'metro-faculty-senate');
    });

    test('successfully configures election parameters and metadata', () => {
      const validatedElection = electionCreateSchema.parse(electionPayload);
      assert.equal(validatedElection.title, 'Faculty Senate Executive Board Election 2026');
      assert.equal(validatedElection.config.showLiveTurnout, true);
    });

    test('validates position hierarchy and registered candidates', () => {
      const validatedPos = positionCreateSchema.parse(positionPresident);
      const validatedCandA = candidateCreateSchema.parse(candidateA);
      const validatedCandB = candidateCreateSchema.parse(candidateB);

      assert.equal(validatedPos.name, 'Senate Chairperson');
      assert.equal(validatedCandA.name, 'Dr. Eleanor Vance');
      assert.equal(validatedCandB.name, 'Prof. Marcus Brody');
    });

    test('advances election lifecycle from draft to live', () => {
      assert.ok(canTransition('draft', 'scheduled'));
      assert.ok(canTransition('draft', 'live'));
      assert.ok(canTransition('live', 'ended'));
    });
  });

  describe('Stage 2: Voter Authentication, Cryptographic Token Issuance & Anonymous Ballot Submission', () => {
    let sessionToken;
    const voteTimestamp = 1774435200000;

    test('issues cryptographically signed and verifiable voting session token', () => {
      sessionToken = createMockSignedToken({
        electionId,
        eligibilityId,
        memberId,
        expiresAt: Date.now() + 900000,
      });
      assert.ok(typeof sessionToken === 'string');
      assert.ok(sessionToken.length > 30);

      const verified = verifyVotingSessionToken(sessionToken);
      assert.ok(verified);
      assert.equal(verified.electionId, electionId);
      assert.equal(verified.eligibilityId, eligibilityId);
    });

    test('submits valid ballot choices through validation pipeline', () => {
      const rawBallot = {
        token: sessionToken,
        selections: [
          {
            positionId: positionPresident.id,
            candidateId: candidateA.id,
          },
        ],
        isAnonymous: true,
      };

      const validatedBallot = voteCastSchema.parse(rawBallot);
      assert.equal(validatedBallot.selections.length, 1);
      assert.equal(validatedBallot.selections[0].candidateId, candidateA.id);
    });

    test('sanitizes and anonymizes vote record to protect voter identity', () => {
      const voteRecord = sanitizeVotePayload({
        electionId,
        positionId: positionPresident.id,
        candidateId: candidateA.id,
        timestamp: voteTimestamp,
        voterEmail: 'voter@university.edu', // PII to be stripped
        voterName: 'Secret Voter',
      });

      assert.equal(voteRecord.voterEmail, undefined);
      assert.equal(voteRecord.voterName, undefined);
      assert.equal(voteRecord.electionId, electionId);

      const blindHash = generateBlindHash(voteRecord);
      assert.equal(blindHash.length, 64);
    });

    test('generates verifiable cryptographic receipt and formatted receipt ID', () => {
      const proofHash = computeReceiptProofHash(electionId, eligibilityId, voteTimestamp);
      assert.equal(proofHash.length, 64);

      const receiptId = formatReceiptId(proofHash);
      assert.ok(receiptId.startsWith('VS-'));
      assert.equal(receiptId.split('-').length, 7);
    });
  });

  describe('Stage 3: Vote Tallying, Results Calculation, Quorum & Certified Snapshot Publishing', () => {
    // Simulated aggregate ballots
    const electionVotes = [
      { positionId: positionPresident.id, candidateId: candidateA.id },
      { positionId: positionPresident.id, candidateId: candidateA.id },
      { positionId: positionPresident.id, candidateId: candidateA.id },
      { positionId: positionPresident.id, candidateId: candidateA.id },
      { positionId: positionPresident.id, candidateId: candidateA.id },
      { positionId: positionPresident.id, candidateId: candidateA.id }, // 6 votes for Candidate A
      { positionId: positionPresident.id, candidateId: candidateB.id },
      { positionId: positionPresident.id, candidateId: candidateB.id },
      { positionId: positionPresident.id, candidateId: candidateB.id },
      { positionId: positionPresident.id, candidateId: candidateB.id }, // 4 votes for Candidate B
    ];

    test('accurately tallies candidate shares and vote distributions', () => {
      const mockPosition = {
        id: positionPresident.id,
        name: positionPresident.name,
        candidates: [
          { id: candidateA.id, name: candidateA.name },
          { id: candidateB.id, name: candidateB.name },
        ],
      };

      const positionResults = calculatePositionResults(mockPosition, electionVotes);
      assert.equal(positionResults.totalVotes, 10);
      assert.equal(positionResults.candidates[0].id, candidateA.id);
      assert.equal(positionResults.candidates[0].voteCount, 6);
      assert.equal(positionResults.candidates[0].percentage, 60);

      assert.equal(positionResults.candidates[1].id, candidateB.id);
      assert.equal(positionResults.candidates[1].voteCount, 4);
      assert.equal(positionResults.candidates[1].percentage, 40);
    });

    test('accurately determines the sole winning candidate', () => {
      const rankedCandidates = [
        { id: candidateA.id, name: candidateA.name, voteCount: 6, percentage: 60 },
        { id: candidateB.id, name: candidateB.name, voteCount: 4, percentage: 40 },
      ];

      const winnerAssessment = determineWinner(rankedCandidates);
      assert.equal(winnerAssessment.winner.id, candidateA.id);
      assert.equal(winnerAssessment.isTie, false);
      assert.equal(winnerAssessment.marginVotes, 2);
    });

    test('computes election turnout and confirms quorum threshold', () => {
      const totalVoted = 10;
      const totalEligible = 12;
      const turnoutRate = Number(((totalVoted / totalEligible) * 100).toFixed(1));
      assert.equal(turnoutRate, 83.3);

      const quorumTarget = 50.0;
      const quorumAchieved = turnoutRate >= quorumTarget;
      assert.equal(quorumAchieved, true);
    });

    test('validates election results publishing readiness and transition', () => {
      const electionMock = {
        id: electionId,
        title: electionPayload.title,
        status: 'ended',
        orgId: 'org-123',
      };

      assert.doesNotThrow(() => validateCanPublish(electionMock));
      assert.ok(canTransition('ended', 'published'));
    });
  });

  describe('Stage 4: Public Results, Sharing Links & Verification Permalinks', () => {
    test('constructs shareable links and embed bundle for the certified election', () => {
      const election = {
        id: electionId,
        title: electionPayload.title,
        orgSlug: orgPayload.slug,
      };

      const bundle = generateShareableLinks(election, 'https://votesphere.org');
      assert.equal(bundle.electionId, electionId);
      assert.ok(bundle.vanityUrl.includes('/org/metro-faculty-senate'));
      assert.ok(bundle.resultsUrl.includes(`/e/${electionId}/results`));
      assert.ok(bundle.iframeEmbedCode.includes('<iframe'));
    });
  });
});
