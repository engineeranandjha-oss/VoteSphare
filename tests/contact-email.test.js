import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contactSubmissionSchema } from '../lib/validations/index.js';
import { maskEmail, escapeHtml, htmlToPlainText } from '../lib/email/client.js';
import { sanitizeRedirectUrl } from '../lib/auth/security.js';
import { validateEnv } from '../lib/env.js';

describe('VoteSphere Live Contact & Real Email Infrastructure Tests', () => {
  // =========================================================================
  // 1. Contact Form Zod Schema Validation
  // =========================================================================
  describe('1. Contact Form Schema Validation', () => {
    const validPayload = {
      name: 'Dr. Sarah Connor',
      email: 'sarah.connor@university.edu',
      subject: 'Departmental Election Configuration',
      category: 'Organization onboarding',
      organization: 'Department of Computer Science',
      message: 'We are planning to run an election for 4,500 students and require cryptographic tally auditing.',
      consent: true,
      honeypot: '',
    };

    it('passes validation with a valid contact payload', () => {
      const result = contactSubmissionSchema.safeParse(validPayload);
      assert.equal(result.success, true);
    });

    it('rejects payload when name is shorter than 2 characters', () => {
      const result = contactSubmissionSchema.safeParse({
        ...validPayload,
        name: 'A',
      });
      assert.equal(result.success, false);
      assert.ok(result.error.issues.some((i) => i.path.includes('name')));
    });

    it('rejects payload with invalid email address format', () => {
      const result = contactSubmissionSchema.safeParse({
        ...validPayload,
        email: 'invalid-email-address',
      });
      assert.equal(result.success, false);
      assert.ok(result.error.issues.some((i) => i.path.includes('email')));
    });

    it('rejects payload when subject is less than 5 characters', () => {
      const result = contactSubmissionSchema.safeParse({
        ...validPayload,
        subject: 'Hey',
      });
      assert.equal(result.success, false);
      assert.ok(result.error.issues.some((i) => i.path.includes('subject')));
    });

    it('rejects payload when message is less than 20 characters', () => {
      const result = contactSubmissionSchema.safeParse({
        ...validPayload,
        message: 'Too short message',
      });
      assert.equal(result.success, false);
      assert.ok(result.error.issues.some((i) => i.path.includes('message')));
    });

    it('rejects payload when consent is false', () => {
      const result = contactSubmissionSchema.safeParse({
        ...validPayload,
        consent: false,
      });
      assert.equal(result.success, false);
      assert.ok(result.error.issues.some((i) => i.path.includes('consent')));
    });

    it('accepts optional category defaults to "General inquiry"', () => {
      const minimalPayload = {
        name: 'John Smith',
        email: 'john@example.com',
        subject: 'General Question Regarding Platform',
        message: 'This is a message with sufficient character length exceeding 20 characters.',
        consent: true,
      };
      const result = contactSubmissionSchema.safeParse(minimalPayload);
      assert.equal(result.success, true);
      assert.equal(result.data.category, 'General inquiry');
    });
  });

  // =========================================================================
  // 2. Email Utilities & Security Sanitization
  // =========================================================================
  describe('2. Email Security, Masking & Escaping Helpers', () => {
    it('masks email addresses correctly for privacy-compliant operational logs', () => {
      assert.equal(maskEmail('alex@domain.com'), 'a***x@domain.com');
      assert.equal(maskEmail('j@domain.com'), 'j*@domain.com');
      assert.equal(maskEmail('support@votesphere.org'), 's***t@votesphere.org');
      assert.equal(maskEmail(''), 'invalid-email');
    });

    it('escapes dangerous HTML characters to prevent template injection', () => {
      const malicious = '<script>alert("xss")</script> & "quotes" \'test\'';
      const escaped = escapeHtml(malicious);
      assert.equal(
        escaped,
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &quot;quotes&quot; &#039;test&#039;'
      );
    });

    it('converts HTML email markup to clean plain text fallback', () => {
      const html = '<div><h2>Title</h2><p>Hello <strong>World</strong>.<br>Visit <a href="https://example.com">Site</a></p></div>';
      const text = htmlToPlainText(html);
      assert.ok(text.includes('Title'));
      assert.ok(text.includes('Hello World.'));
      assert.ok(text.includes('Site (https://example.com)'));
      assert.equal(text.includes('<p>'), false);
    });
  });

  // =========================================================================
  // 3. Environment & Secret Protection
  // =========================================================================
  describe('3. Environment & Secret Isolation Rules', () => {
    it('validates development environment without throwing', () => {
      const validated = validateEnv();
      assert.ok(validated);
      assert.ok(validated.NEXT_PUBLIC_APP_URL);
    });

    it('rejects ENABLE_DEV_LOGIN in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalFlag = process.env.ENABLE_DEV_LOGIN;

      process.env.NODE_ENV = 'production';
      process.env.ENABLE_DEV_LOGIN = 'true';

      assert.throws(() => {
        validateEnv();
      }, /Invalid environment configuration in production/);

      process.env.NODE_ENV = originalEnv;
      process.env.ENABLE_DEV_LOGIN = originalFlag;
    });

    it('rejects open redirects and only allows internal paths', () => {
      assert.equal(sanitizeRedirectUrl('https://phishing-site.com'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('//evil.com'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('javascript:alert(1)'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('/org/acme/dashboard'), '/org/acme/dashboard');
    });
  });

  // =========================================================================
  // 4. Resend Delivery Gate Behavior
  // =========================================================================
  describe('4. Real Email Delivery Feature Gate', () => {
    it('refuses to dispatch emails when EMAIL_DELIVERY_ENABLED is false', async () => {
      const originalFlag = process.env.EMAIL_DELIVERY_ENABLED;
      process.env.EMAIL_DELIVERY_ENABLED = 'false';

      const { sendEmail } = await import('../lib/email/client.js');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test Message</p>',
        eventType: 'unit_test',
      });

      assert.equal(result.success, false);
      assert.equal(result.deliveryDisabled, true);
      assert.ok(result.error.includes('currently disabled'));

      process.env.EMAIL_DELIVERY_ENABLED = originalFlag;
    });
  });
});
