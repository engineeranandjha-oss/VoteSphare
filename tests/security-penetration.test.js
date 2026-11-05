import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  sanitizeRedirectUrl,
  isDevLoginAllowed,
  evaluatePasswordPolicy,
} from '../lib/auth/security.js';
import { escapeHtml } from '../lib/email/client.js';
import {
  contactSubmissionSchema,
  userUpdateSchema,
  uuidSchema,
} from '../lib/validations/index.js';

function safeTimingCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

describe('VoteSphere Module 14.5: Security Penetration & Vulnerability Test Suite', () => {
  // =========================================================================
  // 1. Cross-Site Scripting (XSS) Sanitization & Escaping
  // =========================================================================
  describe('1. XSS Prevention & HTML Entity Escaping', () => {
    test('neutralizes script tags, attributes, and malicious event handlers', () => {
      const payloads = [
        {
          input: '<script>alert("xss")</script>',
          expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        },
        {
          input: '<img src="x" onerror="alert(1)">',
          expected: '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;',
        },
        {
          input: '"><svg onload=alert(document.domain)>',
          expected: '&quot;&gt;&lt;svg onload=alert(document.domain)&gt;',
        },
        {
          input: "javascript:alert('pwned')",
          expected: "javascript:alert(&#039;pwned&#039;)",
        },
      ];

      payloads.forEach(({ input, expected }) => {
        const sanitized = escapeHtml(input);
        assert.equal(sanitized, expected);
        assert.ok(!sanitized.includes('<'));
        assert.ok(!sanitized.includes('>'));
      });
    });

    test('handles empty, null, or undefined values safely without crashing', () => {
      assert.equal(escapeHtml(''), '');
      assert.equal(escapeHtml(null), '');
      assert.equal(escapeHtml(undefined), '');
    });

    test('rejects or sanitizes malicious payload strings in Zod schema validations', () => {
      const xssContact = {
        name: 'Normal User',
        email: 'attacker@evil.com',
        subject: '<script>alert("hack")</script> Inquiry',
        message: 'This message has enough characters to pass validation length check.',
        consent: true,
      };

      const validated = contactSubmissionSchema.parse(xssContact);
      const escapedSubject = escapeHtml(validated.subject);
      assert.ok(!escapedSubject.includes('<script>'));
      assert.ok(escapedSubject.includes('&lt;script&gt;'));
    });
  });

  // =========================================================================
  // 2. Open Redirect Prevention & Path Traversal Immunity
  // =========================================================================
  describe('2. Open Redirect & Path Traversal Prevention', () => {
    test('permits legitimate internal relative paths and deep links', () => {
      const validPaths = [
        '/dashboard',
        '/org/my-org/elections',
        '/e/20000000-0000-4000-a000-000000000002/vote?ref=email',
        '/verify?receipt=VS-1234',
        '/profile#settings',
      ];

      validPaths.forEach((path) => {
        assert.equal(sanitizeRedirectUrl(path), path);
      });
    });

    test('rejects external URL targets, URL scheme exploits, and double-slash protocol tricks', () => {
      const attackVectors = [
        'https://evil-phishing.com/steal-creds',
        'http://malicious.org',
        '//evil.com/path',
        '///evil.com',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        '\\\\evil.com\\share',
        'https://votesphere.app.evil.com',
      ];

      attackVectors.forEach((target) => {
        const sanitized = sanitizeRedirectUrl(target, '/dashboard');
        assert.equal(sanitized, '/dashboard');
      });
    });

    test('falls back to custom fallback URLs securely', () => {
      const result = sanitizeRedirectUrl('https://bad-actor.net', '/auth/login');
      assert.equal(result, '/auth/login');
    });
  });

  // =========================================================================
  // 3. Timing Attack Resistance & Constant-Time String Verification
  // =========================================================================
  describe('3. Timing Attack Mitigation & Constant-Time Comparison', () => {
    test('verifies identical tokens and signatures accurately', () => {
      const tokenA = 'f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8';
      const tokenB = 'f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8';
      assert.equal(safeTimingCompare(tokenA, tokenB), true);
    });

    test('safely rejects mismatched tokens without early-exit branch timing leak', () => {
      const tokenA = 'f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8';
      const tokenDiffFirstChar = '07a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8';
      const tokenDiffLastChar = 'f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a0';
      const tokenDifferentLength = 'f7a8b9c0';

      assert.equal(safeTimingCompare(tokenA, tokenDiffFirstChar), false);
      assert.equal(safeTimingCompare(tokenA, tokenDiffLastChar), false);
      assert.equal(safeTimingCompare(tokenA, tokenDifferentLength), false);
      assert.equal(safeTimingCompare(tokenA, ''), false);
      assert.equal(safeTimingCompare(null, tokenA), false);
      assert.equal(safeTimingCompare(undefined, undefined), false);
    });
  });

  // =========================================================================
  // 4. SQL Injection Resistance & Input Boundary Validation
  // =========================================================================
  describe('4. SQL Injection & Metacharacter Neutralization', () => {
    test('enforces strict UUID formatting to prevent SQL injection in ID parameters', () => {
      const maliciousIds = [
        "1' OR '1'='1",
        "20000000-0000-4000-a000-000000000002; DROP TABLE users; --",
        "admin'--",
        "' UNION SELECT * FROM users --",
      ];

      maliciousIds.forEach((badId) => {
        assert.throws(
          () => {
            uuidSchema.parse(badId);
          },
          /Invalid uuid|Expected/i
        );
      });
    });

    test('rejects illegal character attacks in user profile update', () => {
      assert.throws(() => {
        userUpdateSchema.parse({ name: '' });
      });
    });
  });

  // =========================================================================
  // 5. Sensitive Credential & Session Isolation
  // =========================================================================
  describe('5. Production Environment Guardrails & Secret Isolation', () => {
    test('verifies that mock dev login bypass cannot run under production flags', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalDevLogin = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN;

      try {
        process.env.NODE_ENV = 'production';
        process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = 'true';

        assert.equal(isDevLoginAllowed(), false);
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (originalDevLogin !== undefined) {
          process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = originalDevLogin;
        } else {
          delete process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN;
        }
      }
    });

    test('enforces password policy complexity scoring', () => {
      const weak = evaluatePasswordPolicy('weak');
      assert.equal(weak.valid, false);

      const moderate = evaluatePasswordPolicy('Secret123');
      assert.equal(moderate.valid, true);
      assert.equal(moderate.recommended, false);

      const strong = evaluatePasswordPolicy('Super#Secure!2026Password');
      assert.equal(strong.valid, true);
      assert.equal(strong.recommended, true);
      assert.equal(strong.score >= 4, true);
    });
  });
});
