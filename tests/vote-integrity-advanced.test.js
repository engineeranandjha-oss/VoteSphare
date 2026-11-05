import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  sanitizeVotePayload,
  generateBlindHash,
} from '../lib/voting/anonymity.js';
import {
  computeReceiptProofHash,
  formatReceiptId,
} from '../lib/voting/verification.js';
import {
  verifyVotingSessionToken,
  completeVotingSession,
} from '../lib/voting/session.js';
import { voteCastSchema } from '../lib/validations/index.js';

function createSignedTestSessionToken(payload, secret = 'votesphere-voting-session-secret-key') {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');
  return `${payloadStr}.${signature}`;
}

describe('VoteSphere Module 14.9: Cryptographic Vote Integrity & Double-Voting Prevention Suite', () => {
  const electionId = '20000000-0000-4000-a000-000000000002';
  const positionId = '30000000-0000-4000-a000-000000000003';
  const candidateAliceId = '40000000-0000-4000-a000-000000000004';
  const candidateBobId = '40000000-0000-4000-a000-000000000005';
  const eligibilityId = '60000000-0000-4000-a000-000000000007';
  const userId = '90000000-0000-4000-a000-000000000001';

  // =========================================================================
  // 1. Ballot Anonymity & PII Separation
  // =========================================================================
  describe('1. Ballot Anonymity & Privacy Isolation', () => {
    test('strips all identifying personal data prior to ledger ingestion', () => {
      const rawPayload = {
        electionId,
        positionId,
        candidateId: candidateAliceId,
        voterEmail: 'secret.voter@university.edu',
        voterIp: '198.51.100.25',
        voterFullName: 'Alice Wonder',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
        memberId: '50000000-0000-4000-a000-000000000006',
      };

      const sanitized = sanitizeVotePayload(rawPayload);

      assert.equal(sanitized.electionId, electionId);
      assert.equal(sanitized.positionId, positionId);
      assert.equal(sanitized.candidateId, candidateAliceId);

      // PII must be completely undefined
      assert.equal(sanitized.voterEmail, undefined);
      assert.equal(sanitized.voterIp, undefined);
      assert.equal(sanitized.voterFullName, undefined);
      assert.equal(sanitized.userAgent, undefined);
      assert.equal(sanitized.memberId, undefined);
    });

    test('generates unique deterministic SHA-256 blind hashes', () => {
      const seedAlice = `${electionId}:${positionId}:${candidateAliceId}:fixed-salt-1`;
      const seedBob = `${electionId}:${positionId}:${candidateBobId}:fixed-salt-1`;

      const hashAlice1 = generateBlindHash(seedAlice);
      const hashAlice2 = generateBlindHash(seedAlice);
      const hashBob = generateBlindHash(seedBob);

      assert.equal(hashAlice1, hashAlice2, 'Identical inputs must yield identical hash');
      assert.notEqual(hashAlice1, hashBob, 'Different choices must yield distinct hash');
      assert.equal(hashAlice1.length, 64);
    });
  });

  // =========================================================================
  // 2. Voting Session Token Cryptography & Replay Protection
  // =========================================================================
  describe('2. Voting Session Cryptographic Signing & Anti-Replay Guard', () => {
    test('signs and verifies authentic voting session token', () => {
      const token = createSignedTestSessionToken({
        sessionId: 'session-101',
        userId,
        electionId,
        eligibilityId,
        expiresAt: Date.now() + 900000,
      });

      const payload = verifyVotingSessionToken(token);
      assert.equal(payload.electionId, electionId);
      assert.equal(payload.eligibilityId, eligibilityId);
      assert.ok(payload.expiresAt > Date.now());
    });

    test('rejects tampered token signature immediately', () => {
      const token = createSignedTestSessionToken({
        sessionId: 'session-102',
        userId,
        electionId,
        eligibilityId,
        expiresAt: Date.now() + 900000,
      });

      const [payloadPart, sig] = token.split('.');
      const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
      decoded.eligibilityId = '60000000-0000-4000-a000-000000000099'; // Tampered
      const tamperedPayloadPart = Buffer.from(JSON.stringify(decoded)).toString('base64url');
      const tamperedToken = `${tamperedPayloadPart}.${sig}`;

      assert.throws(
        () => verifyVotingSessionToken(tamperedToken),
        /Invalid voting token signature/i
      );
    });

    test('rejects expired session token', () => {
      const expiredToken = createSignedTestSessionToken({
        sessionId: 'session-103',
        userId,
        electionId,
        eligibilityId,
        expiresAt: Date.now() - 10000,
      });

      assert.throws(
        () => verifyVotingSessionToken(expiredToken),
        /Voting session has expired/i
      );
    });

    test('rejects consumed session token (Anti-Replay / Double Voting Prevention)', () => {
      const sessionId = 'session-104-consumed';
      const token = createSignedTestSessionToken({
        sessionId,
        userId,
        electionId,
        eligibilityId,
        expiresAt: Date.now() + 900000,
      });

      // 1. First verification succeeds
      const payload = verifyVotingSessionToken(token);
      assert.equal(payload.sessionId, sessionId);

      // 2. Consume session upon casting ballot
      completeVotingSession(sessionId, userId, electionId);

      // 3. Second verification MUST fail
      assert.throws(
        () => verifyVotingSessionToken(token),
        /This voting session token has already been consumed/i
      );
    });
  });

  // =========================================================================
  // 3. Ballot Schema Validation & One-Vote Envelopes
  // =========================================================================
  describe('3. Ballot Envelope Structure Validation', () => {
    test('validates multi-position vote submission schema', () => {
      const validSubmission = {
        token: 'valid.mock.token',
        selections: [
          { positionId, candidateId: candidateAliceId },
        ],
        isAnonymous: true,
      };

      const parsed = voteCastSchema.parse(validSubmission);
      assert.equal(parsed.selections.length, 1);
      assert.equal(parsed.selections[0].candidateId, candidateAliceId);
    });

    test('rejects empty selections', () => {
      assert.throws(() => {
        voteCastSchema.parse({
          token: 'valid.mock.token',
          selections: [],
          isAnonymous: true,
        });
      });
    });
  });

  // =========================================================================
  // 4. Cryptographic Receipt Proofs & Tamper Evidence
  // =========================================================================
  describe('4. Receipt Verification Proofs', () => {
    test('computes deterministic receipt proof hash and formats canonical ID', () => {
      const timestamp = 1774435200000;
      const proofHash = computeReceiptProofHash(electionId, eligibilityId, timestamp);
      assert.equal(proofHash.length, 64);

      const receiptId = formatReceiptId(proofHash);
      assert.ok(receiptId.startsWith('VS-'));
      assert.equal(receiptId.split('-').length, 7);
    });

    test('tampering any input byte changes proof digest completely (Avalanche effect)', () => {
      const timestamp = 1774435200000;
      const originalProof = computeReceiptProofHash(electionId, eligibilityId, timestamp);
      const tamperedProof = computeReceiptProofHash(electionId, '60000000-0000-4000-a000-000000000008', timestamp);

      assert.notEqual(originalProof, tamperedProof);
    });
  });
});
