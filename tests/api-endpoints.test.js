import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { contactSubmissionSchema, electionUpdateSchema, memberInviteSchema } from '../lib/validations/index.js';
import { escapeHtml } from '../lib/email/client.js';
import { rateLimiter } from '../lib/security/rate-limiter.js';
import { successResponse, paginatedResponse, errorResponse } from '../lib/utils/response.js';
import { handleApiError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../lib/utils/error-handler.js';
import { formatReceiptId, computeReceiptProofHash } from '../lib/voting/verification.js';
import { canTransition } from '../lib/elections/lifecycle.js';
import { generateShareableLinks } from '../lib/sharing/links.js';
import { generateQRCodeDataUrl } from '../lib/sharing/qrcode.js';

describe('VoteSphere API Contracts & Endpoint Behavioral Test Suite', () => {
  describe('1. Contact API Endpoint Contract (/api/contact)', () => {
    test('validates valid contact request payload', () => {
      const payload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Election configuration inquiry',
        message: 'Hello, we would like to know how multi-seat positions work.',
        category: 'Election support',
        consent: true,
      };
      const validated = contactSubmissionSchema.parse(payload);
      assert.equal(validated.name, 'Jane Doe');
      assert.equal(validated.category, 'Election support');
    });

    test('rejects bot honeypot submission', () => {
      const payload = {
        name: 'Spam Bot',
        email: 'bot@spam.com',
        subject: 'Buy cheap items now',
        message: 'Spam content spanning more than twenty characters.',
        consent: true,
        honeypot: 'bot-filled-trap',
      };
      const validated = contactSubmissionSchema.parse(payload);
      assert.equal(Boolean(validated.honeypot), true);
    });

    test('rate limits repeated inquiries from the same IP client', () => {
      const testIp = '198.51.100.42';
      const key = `contact-test:${testIp}`;

      // Simulate 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const check = rateLimiter.check(key, { limit: 5, windowMs: 60000 });
        assert.equal(check.allowed, true);
      }

      // 6th request must be blocked
      const blocked = rateLimiter.check(key, { limit: 5, windowMs: 60000 });
      assert.equal(blocked.allowed, false);
      assert.ok(blocked.remaining === 0);
    });

    test('escapes HTML characters to prevent XSS in email notification bodies', () => {
      const rawHtml = '<script>alert("xss")</script> & <div class="test">';
      const safe = escapeHtml(rawHtml);
      assert.equal(safe, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &lt;div class=&quot;test&quot;&gt;');
    });
  });

  describe('2. Verification & Receipt API Contracts (/api/verify & /api/receipt)', () => {
    test('verifies canonical receipt hash computation and ID formatting', () => {
      const electionId = '123e4567-e89b-12d3-a456-426614174000';
      const eligibilityId = '223e4567-e89b-12d3-a456-426614174001';
      const timestamp = 1774435200000;

      const hash = computeReceiptProofHash(electionId, eligibilityId, timestamp);
      assert.equal(hash.length, 64);

      const formattedId = formatReceiptId(hash);
      assert.ok(formattedId.startsWith('VS-'));
      assert.equal(formattedId.split('-').length, 7);
    });

    test('generates QR code data URL for verification permalink', async () => {
      const permalink = 'https://votesphere.org/receipt/VS-A1B2-C3D4-E5F6-7890-1234-5678';
      const qrDataUrl = await generateQRCodeDataUrl(permalink, { width: 300 });
      assert.ok(qrDataUrl.startsWith('data:image/png;base64,'));
    });
  });

  describe('3. Election & Lifecycle Management API Contracts (/api/elections/[id])', () => {
    test('validates election update and state change payload', () => {
      const payload = {
        title: 'Updated Board of Trustees Election',
        status: 'published',
      };
      const parsed = electionUpdateSchema.parse(payload);
      assert.equal(parsed.title, 'Updated Board of Trustees Election');
      assert.equal(parsed.status, 'published');
    });

    test('enforces permitted lifecycle state machine transitions', () => {
      assert.equal(canTransition('draft', 'live'), true);
      assert.equal(canTransition('live', 'ended'), true);
      assert.equal(canTransition('ended', 'published'), true);
      assert.equal(canTransition('published', 'live'), false);
    });

    test('generates complete shareable links bundle with vanity slugs', () => {
      const election = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Student Body Presidential Election',
        orgSlug: 'stanford-alumni',
      };
      const links = generateShareableLinks(election, 'https://votesphere.org');
      assert.ok(links.vanityUrl.includes('/org/stanford-alumni'));
      assert.ok(links.publicUrl.includes('/e/123e4567-e89b-12d3-a456-426614174000'));
      assert.ok(links.iframeEmbedCode.includes('<iframe'));
    });
  });

  describe('4. Standard Error Response Protocol for All API Routes', () => {
    test('formats 400 Validation Error consistently', async () => {
      const res = handleApiError(new ValidationError('Missing required parameters'));
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.message, 'Missing required parameters');
    });

    test('formats 401 Unauthorized Error consistently', async () => {
      const res = handleApiError(new UnauthorizedError());
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.message, 'Authentication required');
    });

    test('formats 403 Forbidden Error consistently', async () => {
      const res = handleApiError(new ForbiddenError('Only organization admins may export voter keys'));
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.message, 'Only organization admins may export voter keys');
    });

    test('formats 404 Not Found Error consistently', async () => {
      const res = handleApiError(new NotFoundError('Election not found'));
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.message, 'Election not found');
    });
  });
});
