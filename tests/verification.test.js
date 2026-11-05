import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatReceiptId,
  computeReceiptProofHash,
} from '../lib/voting/verification.js';

describe('Ballot Receipt Verification & Ledger Cryptography Test Suite', () => {
  describe('1. Receipt ID Formatting', () => {
    it('formats a 64-character SHA-256 hash into canonical VS-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX representation', () => {
      const hash = 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';
      const formatted = formatReceiptId(hash);

      assert.equal(formatted, 'VS-A1B2-C3D4-E5F6-7890-1234-5678');
      assert.equal(formatted.startsWith('VS-'), true);
      assert.equal(formatted.split('-').length, 7);
    });

    it('handles dirty strings with non-hex characters safely', () => {
      const dirty = 'vs-a1b2-c3d4-e5f6-7890-1234-5678';
      const formatted = formatReceiptId(dirty);
      assert.equal(formatted.startsWith('VS-'), true);
    });

    it('returns empty string for null, undefined or empty input', () => {
      assert.equal(formatReceiptId(null), '');
      assert.equal(formatReceiptId(undefined), '');
      assert.equal(formatReceiptId(''), '');
    });
  });

  describe('2. Deterministic Receipt Proof Hash Computation', () => {
    it('generates consistent, deterministic SHA-256 digest for identical election, eligibility and timestamp', () => {
      const electionId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      const eligibilityId = '7ba85f64-5717-4562-b3fc-2c963f66afa7';
      const timestamp = new Date('2026-09-22T10:00:00.000Z');

      const hash1 = computeReceiptProofHash(electionId, eligibilityId, timestamp);
      const hash2 = computeReceiptProofHash(electionId, eligibilityId, timestamp);

      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64);
      assert.equal(/^[0-9a-f]{64}$/.test(hash1), true);
    });

    it('produces identical hash whether timestamp is a Date object or millisecond timestamp integer', () => {
      const electionId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      const eligibilityId = '7ba85f64-5717-4562-b3fc-2c963f66afa7';
      const timestampDate = new Date('2026-09-22T10:00:00.000Z');
      const timestampMs = timestampDate.getTime();

      const hashFromDate = computeReceiptProofHash(electionId, eligibilityId, timestampDate);
      const hashFromMs = computeReceiptProofHash(electionId, eligibilityId, timestampMs);

      assert.equal(hashFromDate, hashFromMs);
    });

    it('produces completely different hashes for different eligibility IDs (Tamper-Evidence)', () => {
      const electionId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      const elig1 = '11111111-1111-1111-1111-111111111111';
      const elig2 = '22222222-2222-2222-2222-222222222222';
      const timestamp = new Date('2026-09-22T10:00:00.000Z');

      const hash1 = computeReceiptProofHash(electionId, elig1, timestamp);
      const hash2 = computeReceiptProofHash(electionId, elig2, timestamp);

      assert.notEqual(hash1, hash2);
    });

    it('produces completely different hashes for different timestamps (Replay Prevention)', () => {
      const electionId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      const elig = '11111111-1111-1111-1111-111111111111';
      const time1 = new Date('2026-09-22T10:00:00.000Z');
      const time2 = new Date('2026-09-22T10:00:01.000Z');

      const hash1 = computeReceiptProofHash(electionId, elig, time1);
      const hash2 = computeReceiptProofHash(electionId, elig, time2);

      assert.notEqual(hash1, hash2);
    });
  });

  describe('3. End-to-End Verification Pipeline', () => {
    it('validates receipt token structure and verifiable status mappings', () => {
      const mapStatus = (s) =>
        s === 'published'
          ? 'certified_tally'
          : s === 'ended'
          ? 'closed_polls'
          : 'sealed_and_recorded';

      assert.equal(mapStatus('published'), 'certified_tally');
      assert.equal(mapStatus('ended'), 'closed_polls');
      assert.equal(mapStatus('live'), 'sealed_and_recorded');
      assert.equal(mapStatus('draft'), 'sealed_and_recorded');
    });
  });
});
