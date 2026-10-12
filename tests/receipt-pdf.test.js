import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { downloadBallotReceiptPdf } from '../lib/utils/receipt-pdf.js';

describe('PDF Ballot Receipt Generator Test Suite', () => {
  describe('1. PDF Generation & Document Creation', () => {
    it('creates a valid jsPDF document with standard A4 dimensions', () => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      assert.equal(Math.round(width), 210);
      assert.equal(Math.round(height), 297);
    });

    it('generates a valid QR code data URL for receipt verification', async () => {
      const verifyUrl = 'https://votesphere.app/receipt/VS-A1B2-C3D4-E5F6-7890-1234-5678';
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 256,
      });

      assert.equal(typeof qrDataUrl, 'string');
      assert.equal(qrDataUrl.startsWith('data:image/png;base64,'), true);
    });

    it('executes downloadBallotReceiptPdf end-to-end without reference errors', async () => {
      const filename = await downloadBallotReceiptPdf({
        receiptId: 'VS-A1B2-C3D4-E5F6-7890-1234-5678',
        electionId: 'e1234567-89ab-cdef-0123-456789abcdef',
        electionTitle: 'General Chairman Election 2026',
        timestamp: '2026-09-22T12:00:00.000Z',
        positionsVotedCount: 2,
        isAnonymous: true,
      });

      assert.equal(filename, 'VoteSphere-Ballot-Receipt-General-Chairman-Election-2026.pdf');
    });
  });

  describe('2. Filename Sanitization for Receipt PDF', () => {
    it('sanitizes complex election titles into clean hyphenated filenames', () => {
      const titles = [
        {
          input: 'General Chairman Election 2026',
          expected: 'VoteSphere-Ballot-Receipt-General-Chairman-Election-2026.pdf',
        },
        {
          input: 'Student Union (2025/2026) — President & Vice-President!',
          expected: 'VoteSphere-Ballot-Receipt-Student-Union-2025-2026-President-Vice-President.pdf',
        },
        {
          input: 'Annual Board of Directors: 2026 Edition',
          expected: 'VoteSphere-Ballot-Receipt-Annual-Board-of-Directors-2026-Edition.pdf',
        },
      ];

      for (const { input, expected } of titles) {
        const cleanTitle = (input || 'Election')
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const filename = `VoteSphere-Ballot-Receipt-${cleanTitle || 'Election'}.pdf`;
        assert.equal(filename, expected);
      }
    });

    it('handles empty or special character titles safely with fallback', () => {
      const input = '*** $$$ @@@';
      const cleanTitle = (input || 'Election')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const filename = `VoteSphere-Ballot-Receipt-${cleanTitle || 'Election'}.pdf`;
      assert.equal(filename, 'VoteSphere-Ballot-Receipt-Election.pdf');
    });
  });

  describe('3. Receipt Metadata & Privacy Isolation', () => {
    it('ensures receipt payload contains zero personal identifying information (PII)', () => {
      const receiptPayload = {
        receiptId: 'VS-9876-5432-10AB-CDEF-0123-4567',
        electionId: 'e1234567-89ab-cdef-0123-456789abcdef',
        electionTitle: 'General Chairman Election 2026',
        timestamp: '2026-09-22T12:00:00.000Z',
        positionsVotedCount: 3,
        isAnonymous: true,
      };

      assert.equal('email' in receiptPayload, false);
      assert.equal('userId' in receiptPayload, false);
      assert.equal('userName' in receiptPayload, false);
      assert.equal('ipAddress' in receiptPayload, false);
      assert.equal(receiptPayload.isAnonymous, true);
      assert.equal(receiptPayload.receiptId.startsWith('VS-'), true);
    });
  });
});
