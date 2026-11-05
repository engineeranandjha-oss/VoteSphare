import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  organizationCreateSchema,
  electionCreateSchema,
  positionCreateSchema,
  candidateCreateSchema,
  voteCastSchema,
  loginSchema,
} from '../lib/validations/index.js';
import { canTransition } from '../lib/elections/lifecycle.js';
import {
  sanitizeVotePayload,
  generateBlindHash,
} from '../lib/voting/anonymity.js';
import { verifyVotingSessionToken } from '../lib/voting/session.js';
import {
  computeReceiptProofHash,
  formatReceiptId,
} from '../lib/voting/verification.js';
import {
  calculatePositionResults,
  determineWinner,
} from '../lib/results/calculation.js';
import { validateCanPublish } from '../lib/results/publishing.js';
import { generateShareableLinks } from '../lib/sharing/links.js';
import { downloadBallotReceiptPdf } from '../lib/utils/receipt-pdf.js';
import {
  generateVoterInvitationHtml,
  generateResultsAnnouncementHtml,
} from '../lib/email/election-notifications.js';

function createMockSignedToken(payload, secret = process.env.INVITATION_SECRET || 'votesphere-voting-session-secret-key') {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  return `${payloadStr}.${signature}`;
}

describe('VoteSphere End-to-End (E2E) Critical User Journey Test Suite', () => {
  // Global Mock IDs & Fixtures
  const electionId = '20000000-0000-4000-a000-000000000002';
  const posPresidentId = '30000000-0000-4000-a000-000000000003';
  const candAliceId = '40000000-0000-4000-a000-000000000004';
  const candBobId = '40000000-0000-4000-a000-000000000005';
  const voterMemberId = '50000000-0000-4000-a000-000000000006';
  const voterEligibilityId = '60000000-0000-4000-a000-000000000007';

  // =========================================================================
  // Journey 1: Voter Full Lifecycle (Discovery -> Authentication -> Ballot -> Verification -> PDF)
  // =========================================================================
  describe('E2E Journey 1: Complete Voter Democratic Lifecycle', () => {
    let activeToken;
    let ballotReceiptProof;
    let canonicalReceiptId;
    const voteTimestamp = 1774435200000; // Deterministic timestamp for reproducibility

    test('Step 1.1: Voter signs in or validates credentials', () => {
      const loginPayload = {
        email: 'elector@university.edu',
        password: 'SecurePassword123!',
      };
      const validated = loginSchema.parse(loginPayload);
      assert.equal(validated.email, 'elector@university.edu');
    });

    test('Step 1.2: Voter receives election invitation notification with booth URL', () => {
      const invitation = generateVoterInvitationHtml({
        electionTitle: 'Student Body General Election 2026',
        orgName: 'State University',
        voteUrl: `https://votesphere.app/e/${electionId}/booth`,
        startDate: '2026-03-25T00:00:00Z',
        endDate: '2026-03-26T23:59:59Z',
      });
      assert.ok(invitation.includes('Student Body General Election 2026'));
      assert.ok(invitation.includes(`/e/${electionId}/booth`));
    });

    test('Step 1.3: Elector is issued a secure 15-minute voting session token', () => {
      activeToken = createMockSignedToken({
        electionId,
        eligibilityId: voterEligibilityId,
        memberId: voterMemberId,
        expiresAt: Date.now() + 900000,
      });

      const session = verifyVotingSessionToken(activeToken);
      assert.equal(session.electionId, electionId);
      assert.equal(session.eligibilityId, voterEligibilityId);
    });

    test('Step 1.4: Elector casts encrypted ballot and payload is strictly anonymized', () => {
      // 1. Submit ballot payload
      const castPayload = voteCastSchema.parse({
        token: activeToken,
        selections: [
          {
            positionId: posPresidentId,
            candidateId: candAliceId,
          },
        ],
        isAnonymous: true,
      });
      assert.equal(castPayload.selections.length, 1);

      // 2. Strip private identifiers from ballot record
      const voteRecord = sanitizeVotePayload({
        electionId,
        positionId: posPresidentId,
        candidateId: candAliceId,
        voterEmail: 'elector@university.edu', // PII to be stripped
        voterIp: '192.0.2.1',
        voterName: 'Secret Elector',
      });

      assert.equal(voteRecord.voterEmail, undefined);
      assert.equal(voteRecord.voterIp, undefined);
      assert.equal(voteRecord.voterName, undefined);
      assert.equal(voteRecord.candidateId, candAliceId);

      const blindHash = generateBlindHash(voteRecord);
      assert.equal(blindHash.length, 64);
    });

    test('Step 1.5: Voter receives cryptographic receipt for independent ledger audit', () => {
      ballotReceiptProof = computeReceiptProofHash(electionId, voterEligibilityId, voteTimestamp);
      assert.equal(ballotReceiptProof.length, 64);

      canonicalReceiptId = formatReceiptId(ballotReceiptProof);
      assert.ok(canonicalReceiptId.startsWith('VS-'));
      assert.equal(canonicalReceiptId.split('-').length, 7);
    });

    test('Step 1.6: Voter generates and downloads tamper-proof PDF ballot receipt', async () => {
      const receiptData = {
        receiptId: canonicalReceiptId,
        electionTitle: 'Student Body General Election 2026',
        orgName: 'State University',
        timestamp: new Date(voteTimestamp).toISOString(),
        electionId,
        eligibilityId: voterEligibilityId,
        positionsVotedCount: 1,
        isAnonymous: true,
      };

      const filename = await downloadBallotReceiptPdf(receiptData);
      assert.ok(filename);
      assert.ok(filename.includes('VoteSphere-Ballot-Receipt-Student-Body-General-Election-2026.pdf'));
    });
  });

  // =========================================================================
  // Journey 2: Administrator Full Lifecycle (Org Setup -> Election Launch -> Close -> Publish Results)
  // =========================================================================
  describe('E2E Journey 2: Complete Administrator Election Management Lifecycle', () => {
    test('Step 2.1: Admin establishes organization and creates election parameters', () => {
      const org = organizationCreateSchema.parse({
        name: 'National Engineering Council',
        slug: 'nec-governance',
        type: 'society',
      });
      assert.equal(org.slug, 'nec-governance');

      const election = electionCreateSchema.parse({
        title: 'NEC National Executive Board 2026',
        config: {
          allowCandidateWithdrawal: true,
          requireVoterVerification: true,
          showLiveTurnout: true,
        },
      });
      assert.equal(election.title, 'NEC National Executive Board 2026');
    });

    test('Step 2.2: Admin registers candidate slate across ballot positions', () => {
      const pos = positionCreateSchema.parse({
        name: 'President & CEO',
        order: 1,
      });
      assert.equal(pos.name, 'President & CEO');

      const candA = candidateCreateSchema.parse({
        name: 'Alice Johnson',
        bio: 'Senior Systems Architect',
      });
      const candB = candidateCreateSchema.parse({
        name: 'Bob Smith',
        bio: 'Principal Engineer',
      });
      assert.equal(candA.name, 'Alice Johnson');
      assert.equal(candB.name, 'Bob Smith');
    });

    test('Step 2.3: Admin transitions election to live polling and generates share suite', () => {
      assert.ok(canTransition('draft', 'live'));

      const electionMock = {
        id: electionId,
        title: 'NEC National Executive Board 2026',
        orgSlug: 'nec-governance',
      };
      const links = generateShareableLinks(electionMock, 'https://votesphere.app');
      assert.ok(links.vanityUrl.includes('/org/nec-governance'));
      assert.ok(links.voteUrl.includes(`/e/${electionId}/vote`));
    });

    test('Step 2.4: Polls close, election ends, and results calculation decides winner', () => {
      assert.ok(canTransition('live', 'ended'));

      const mockPosition = {
        id: posPresidentId,
        name: 'President & CEO',
        candidates: [
          { id: candAliceId, name: 'Alice Johnson' },
          { id: candBobId, name: 'Bob Smith' },
        ],
      };

      const castVotes = [
        { positionId: posPresidentId, candidateId: candAliceId },
        { positionId: posPresidentId, candidateId: candAliceId },
        { positionId: posPresidentId, candidateId: candAliceId },
        { positionId: posPresidentId, candidateId: candBobId },
      ];

      const results = calculatePositionResults(mockPosition, castVotes);
      assert.equal(results.totalVotes, 4);
      assert.equal(results.candidates[0].id, candAliceId);
      assert.equal(results.candidates[0].voteCount, 3);
      assert.equal(results.candidates[0].percentage, 75);

      const decision = determineWinner([
        { id: candAliceId, name: 'Alice Johnson', voteCount: 3, percentage: 75 },
        { id: candBobId, name: 'Bob Smith', voteCount: 1, percentage: 25 },
      ]);
      assert.equal(decision.winner.id, candAliceId);
      assert.equal(decision.isTie, false);
      assert.equal(decision.marginVotes, 2);
    });

    test('Step 2.5: Admin publishes certified election snapshot and broadcasts results announcement', () => {
      const electionEnded = {
        id: electionId,
        title: 'NEC National Executive Board 2026',
        status: 'ended',
      };
      assert.doesNotThrow(() => validateCanPublish(electionEnded));
      assert.ok(canTransition('ended', 'published'));

      const announcementEmail = generateResultsAnnouncementHtml({
        electionTitle: electionEnded.title,
        orgName: 'National Engineering Council',
        resultsUrl: `https://votesphere.app/e/${electionId}/results`,
        certifiedAt: new Date().toISOString(),
      });
      assert.ok(announcementEmail.includes('Official Results Certified'));
      assert.ok(announcementEmail.includes(`/e/${electionId}/results`));
    });
  });
});
