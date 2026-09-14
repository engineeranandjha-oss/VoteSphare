import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { verifyAnonymityIntegrity, sanitizeVotePayload, generateBlindHash } from '../lib/voting/anonymity.js';
import { verifyVotingSessionToken, completeVotingSession } from '../lib/voting/session.js';
import { voteCastSchema, voteSelectionSchema } from '../lib/validations/index.js';

describe('Vote Integrity Test Suite', () => {
  // ============================================================
  // 1. Anonymity Architecture Tests
  // ============================================================
  describe('1. Ballot Anonymity & Privacy Isolation', () => {
    test('Vote model must not contain direct user identifying fields (userId, email)', async () => {
      const audit = await verifyAnonymityIntegrity('test-election-uuid');
      assert.strictEqual(audit.hasUserIdentifier, false);
      assert.strictEqual(audit.anonymous, true);

      // Explicitly assert forbidden keys are absent
      const forbiddenKeys = ['userId', 'user_id', 'voterId', 'voter_id', 'email', 'name'];
      for (const key of forbiddenKeys) {
        assert.strictEqual(
          audit.auditedAttributes.includes(key),
          false,
          `Forbidden user attribute "${key}" found in Vote model`
        );
      }
    });

    test('sanitizeVotePayload must strip private/internal metadata', () => {
      const rawVote = {
        id: 'vote-123',
        electionId: 'election-456',
        positionId: 'pos-789',
        candidateId: 'cand-101',
        isAnonymous: true,
        secretInternalMeta: 'should-not-leak',
      };

      const sanitized = sanitizeVotePayload(rawVote);
      assert.strictEqual(sanitized.id, 'vote-123');
      assert.strictEqual(sanitized.positionId, 'pos-789');
      assert.strictEqual(sanitized.candidateId, 'cand-101');
      assert.strictEqual(sanitized.isAnonymous, true);
      assert.strictEqual(sanitized.secretInternalMeta, undefined);
    });

    test('generateBlindHash produces consistent, deterministic SHA-256 digests', () => {
      const hash1 = generateBlindHash('test-elector-token');
      const hash2 = generateBlindHash('test-elector-token');
      const hash3 = generateBlindHash('different-token');

      assert.strictEqual(hash1, hash2);
      assert.notStrictEqual(hash1, hash3);
      assert.strictEqual(hash1.length, 64);
    });
  });

  // ============================================================
  // 2. Voting Session & Token Cryptography Tests
  // ============================================================
  describe('2. Voting Session Token Cryptography', () => {
    const SECRET_KEY = process.env.INVITATION_SECRET || process.env.JWT_SECRET || 'votesphere-voting-session-secret-key';

    function createTestToken(payload) {
      const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(payloadStr)
        .digest('hex');
      return `${payloadStr}.${signature}`;
    }

    test('Valid signed session token is verified correctly', () => {
      const sessionId = crypto.randomUUID();
      const payload = {
        sessionId,
        userId: 'user-uuid-1',
        electionId: 'election-uuid-1',
        eligibilityId: 'eligibility-uuid-1',
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
      };

      const token = createTestToken(payload);
      const verified = verifyVotingSessionToken(token);

      assert.strictEqual(verified.sessionId, sessionId);
      assert.strictEqual(verified.userId, 'user-uuid-1');
      assert.strictEqual(verified.electionId, 'election-uuid-1');
    });

    test('Tampered token signature is immediately rejected', () => {
      const payload = {
        sessionId: crypto.randomUUID(),
        userId: 'user-uuid-1',
        electionId: 'election-uuid-1',
        eligibilityId: 'eligibility-uuid-1',
        expiresAt: Date.now() + 60000,
      };

      const validToken = createTestToken(payload);
      const tamperedToken = `${validToken.split('.')[0]}.invaliddeadbeefsignature`;

      assert.throws(() => {
        verifyVotingSessionToken(tamperedToken);
      }, /Invalid voting token signature/);
    });

    test('Expired session token is rejected', () => {
      const payload = {
        sessionId: crypto.randomUUID(),
        userId: 'user-uuid-1',
        electionId: 'election-uuid-1',
        eligibilityId: 'eligibility-uuid-1',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      const expiredToken = createTestToken(payload);

      assert.throws(() => {
        verifyVotingSessionToken(expiredToken);
      }, /Voting session has expired/);
    });

    test('Consumed session token cannot be reused (Replay Protection)', () => {
      const sessionId = crypto.randomUUID();
      const payload = {
        sessionId,
        userId: 'user-uuid-1',
        electionId: 'election-uuid-1',
        eligibilityId: 'eligibility-uuid-1',
        expiresAt: Date.now() + 60000,
      };

      const token = createTestToken(payload);

      // Verify once (should pass)
      const verified = verifyVotingSessionToken(token);
      assert.strictEqual(verified.sessionId, sessionId);

      // Consume the session
      completeVotingSession(sessionId);

      // Second verification attempt must fail
      assert.throws(() => {
        verifyVotingSessionToken(token);
      }, /already been consumed/);
    });
  });

  // ============================================================
  // 3. Ballot Schema & Input Validation Tests
  // ============================================================
  describe('3. Ballot Schema Validation', () => {
    test('Valid ballot with selections passes Zod validation', () => {
      const validPayload = {
        token: 'valid.token',
        selections: [
          {
            positionId: '11111111-1111-4111-8111-111111111111',
            candidateId: '22222222-2222-4222-8222-222222222222',
          },
        ],
        isAnonymous: true,
      };

      const parsed = voteCastSchema.parse(validPayload);
      assert.strictEqual(parsed.selections.length, 1);
      assert.strictEqual(parsed.isAnonymous, true);
    });

    test('Empty selections array is rejected', () => {
      const emptyPayload = {
        token: 'valid.token',
        selections: [],
      };

      assert.throws(() => {
        voteCastSchema.parse(emptyPayload);
      });
    });

    test('Invalid UUID in candidate selection is rejected', () => {
      assert.throws(() => {
        voteSelectionSchema.parse({
          positionId: 'not-a-uuid',
          candidateId: '22222222-2222-4222-8222-222222222222',
        });
      });
    });
  });
});
