import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  maskEmail,
  escapeHtml,
  htmlToPlainText,
  sendEmail,
} from '../lib/email/client.js';
import {
  generateInviteToken,
  verifyInviteToken,
} from '../lib/email/invitation.js';
import { contactSubmissionSchema } from '../lib/validations/index.js';

describe('VoteSphere Email Abuse Protection & Delivery Security Test Suite', () => {
  // =========================================================================
  // 1. PII Log Masking & Anonymization
  // =========================================================================
  describe('1. PII Masking & Privacy Guard in Email Logs', () => {
    test('masks standard email addresses safely for operational logs', () => {
      const maskedA = maskEmail('sarah.connor@university.edu');
      assert.equal(maskedA, 's***r@university.edu');
      assert.ok(!maskedA.includes('sarah.connor'));

      const maskedB = maskEmail('a@b.com');
      assert.equal(maskedB, 'a*@b.com');
    });

    test('handles empty or non-string values gracefully', () => {
      assert.equal(maskEmail(''), 'invalid-email');
      assert.equal(maskEmail(null), 'invalid-email');
      assert.equal(maskEmail(undefined), 'invalid-email');
    });
  });

  // =========================================================================
  // 2. Anti-Spam Honeypot & Contact Payload Security
  // =========================================================================
  describe('2. Anti-Spam Honeypot & Contact Submission Guard', () => {
    test('accepts clean contact submissions with empty honeypot field', () => {
      const validPayload = {
        name: 'Jane Doe',
        email: 'jane.doe@university.edu',
        subject: 'Election Question',
        message: 'This is a detailed message with sufficient length for validation.',
        consent: true,
        honeypot: '',
      };
      const parsed = contactSubmissionSchema.parse(validPayload);
      assert.equal(parsed.honeypot, '');
    });

    test('flags bot submissions that fill in the honeypot field', () => {
      const botPayload = {
        name: 'Spam Bot',
        email: 'bot@spam.com',
        subject: 'Buy cheap watches now',
        message: 'This is spam message content that exceeds twenty characters.',
        consent: true,
        honeypot: 'http://spam-link.ru',
      };
      const parsed = contactSubmissionSchema.parse(botPayload);
      const isBot = Boolean(parsed.honeypot && parsed.honeypot.trim().length > 0);
      assert.equal(isBot, true);
    });
  });

  // =========================================================================
  // 3. Cryptographic Invitation Token Signing & Tamper Verification
  // =========================================================================
  describe('3. Invitation Token Signing & Tamper Verification', () => {
    const orgId = '10000000-0000-4000-a000-000000000001';
    const email = 'scholar@university.edu';

    test('generates and verifies valid invitation token', () => {
      const token = generateInviteToken({
        orgId,
        email,
        role: 'voter',
        expiresInDays: 7,
      });

      const verification = verifyInviteToken(token);
      assert.equal(verification.valid, true);
      assert.equal(verification.data.orgId, orgId);
      assert.equal(verification.data.email, email);
      assert.equal(verification.data.role, 'voter');
    });

    test('rejects tampered invitation token signature', () => {
      const token = generateInviteToken({
        orgId,
        email,
        role: 'voter',
      });

      const [payloadPart, sig] = token.split('.');
      const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
      decoded.role = 'owner'; // Privilege escalation attempt
      const tamperedPayloadPart = Buffer.from(JSON.stringify(decoded)).toString('base64url');
      const tamperedToken = `${tamperedPayloadPart}.${sig}`;

      const verification = verifyInviteToken(tamperedToken);
      assert.equal(verification.valid, false);
      assert.ok(verification.error.includes('Invalid') || verification.error.includes('signature'));
    });
  });

  // =========================================================================
  // 4. HTML to Plain-Text Conversion & Sanitization
  // =========================================================================
  describe('4. HTML to Plain Text & Injection Scrubbing', () => {
    test('converts HTML email bodies into clean plain-text alternative', () => {
      const html = '<h1>Welcome!</h1><p>Please vote at <a href="https://votesphere.app/e/123">this link</a>.</p>';
      const text = htmlToPlainText(html);
      assert.ok(text.includes('Welcome!'));
      assert.ok(text.includes('https://votesphere.app/e/123'));
      assert.ok(!text.includes('<h1>'));
      assert.ok(!text.includes('<p>'));
    });

    test('escapes HTML special characters to prevent template injection', () => {
      const escaped = escapeHtml('<script>evil()</script>');
      assert.equal(escaped, '&lt;script&gt;evil()&lt;/script&gt;');
    });
  });

  // =========================================================================
  // 5. Production Delivery Gate Protection
  // =========================================================================
  describe('5. Real Email Delivery Feature Gate', () => {
    test('refuses external SMTP dispatch when EMAIL_DELIVERY_ENABLED is false', async () => {
      const originalFlag = process.env.EMAIL_DELIVERY_ENABLED;
      try {
        process.env.EMAIL_DELIVERY_ENABLED = 'false';
        const result = await sendEmail({
          to: 'voter@example.com',
          subject: 'Test Notice',
          html: '<p>Test</p>',
        });
        assert.equal(result.success, false);
        assert.equal(result.deliveryDisabled, true);
        assert.ok(result.error.includes('disabled'));
      } finally {
        if (originalFlag !== undefined) {
          process.env.EMAIL_DELIVERY_ENABLED = originalFlag;
        } else {
          delete process.env.EMAIL_DELIVERY_ENABLED;
        }
      }
    });
  });
});
