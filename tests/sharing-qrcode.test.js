import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateQRCodeDataUrl,
  generateQRCodeSvg,
  generateQRCodeBuffer,
  generateElectionQRCodes,
} from '../lib/sharing/qrcode.js';

describe('QR Code Generation Test Suite', () => {
  const targetUrl = 'https://votesphere.io/e/elec-123-test';
  const electionId = 'elec-123-test';
  const mockBaseUrl = 'https://votesphere.io';

  describe('1. Individual QR Code Generators', () => {
    it('generates a valid PNG Data URL', async () => {
      const dataUrl = await generateQRCodeDataUrl(targetUrl);
      assert.ok(typeof dataUrl === 'string');
      assert.ok(dataUrl.startsWith('data:image/png;base64,'));
      assert.ok(dataUrl.length > 100);
    });

    it('generates a valid scalable SVG XML string', async () => {
      const svg = await generateQRCodeSvg(targetUrl);
      assert.ok(typeof svg === 'string');
      assert.ok(svg.includes('<svg'));
      assert.ok(svg.includes('</svg>'));
    });

    it('generates a binary PNG buffer with correct PNG header signature', async () => {
      const buffer = await generateQRCodeBuffer(targetUrl);
      assert.ok(Buffer.isBuffer(buffer));
      assert.ok(buffer.length > 50);

      // Verify PNG magic header: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
      assert.strictEqual(buffer[0], 0x89);
      assert.strictEqual(buffer[1], 0x50); // P
      assert.strictEqual(buffer[2], 0x4e); // N
      assert.strictEqual(buffer[3], 0x47); // G
    });

    it('throws error when target text is missing or empty', async () => {
      await assert.rejects(async () => generateQRCodeDataUrl(''), /Target text or URL is required/);
      await assert.rejects(async () => generateQRCodeSvg(null), /Target text or URL is required/);
    });
  });

  describe('2. Comprehensive Election QR Suite', () => {
    it('generates complete QR code suite for an election', async () => {
      const suite = await generateElectionQRCodes(electionId, mockBaseUrl);

      assert.strictEqual(suite.electionId, electionId);

      // Public Overview QR
      assert.strictEqual(suite.public.targetUrl, 'https://votesphere.io/e/elec-123-test');
      assert.ok(suite.public.dataUrl.startsWith('data:image/png;base64,'));

      // Direct Voting Booth QR
      assert.strictEqual(suite.vote.targetUrl, 'https://votesphere.io/e/elec-123-test/vote');
      assert.ok(suite.vote.dataUrl.startsWith('data:image/png;base64,'));

      // Results QR
      assert.strictEqual(suite.results.targetUrl, 'https://votesphere.io/e/elec-123-test/results');
      assert.ok(suite.results.dataUrl.startsWith('data:image/png;base64,'));

      // Metadata
      assert.strictEqual(suite.metadata.errorCorrectionLevel, 'H');
      assert.strictEqual(suite.metadata.baseUrl, mockBaseUrl);
    });
  });
});
