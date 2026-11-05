import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  signupSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from '../lib/validations/index.js';
import {
  sanitizeRedirectUrl,
  isDevLoginAllowed,
  evaluatePasswordPolicy,
} from '../lib/auth/security.js';
import { User, Member, Eligibility } from '../models/index.js';

describe('VoteSphere Authentication & Security Test Suite', () => {
  // =========================================================================
  // 1. Email + Password Validation
  // =========================================================================
  describe('1. Signup & Login Validation Rules', () => {
    it('passes signup validation with valid credentials and matching passwords', () => {
      const validSignup = {
        name: 'Jane Doe',
        email: 'jane@organization.org',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
      };
      const result = signupSchema.safeParse(validSignup);
      assert.equal(result.success, true);
    });

    it('rejects signup when passwords do not match', () => {
      const mismatchSignup = {
        name: 'Jane Doe',
        email: 'jane@organization.org',
        password: 'StrongPassword123!',
        confirmPassword: 'DifferentPassword456!',
      };
      const result = signupSchema.safeParse(mismatchSignup);
      assert.equal(result.success, false);
      assert.ok(result.error.issues.some((i) => i.message.includes('Passwords do not match')));
    });

    it('rejects signup with short password less than 8 characters', () => {
      const shortSignup = {
        name: 'Jane Doe',
        email: 'jane@organization.org',
        password: 'short',
        confirmPassword: 'short',
      };
      const result = signupSchema.safeParse(shortSignup);
      assert.equal(result.success, false);
      assert.ok(result.error.issues.some((i) => i.message.includes('at least 8 characters')));
    });

    it('rejects signup with invalid email format', () => {
      const invalidEmailSignup = {
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
      };
      const result = signupSchema.safeParse(invalidEmailSignup);
      assert.equal(result.success, false);
    });

    it('passes login validation with valid email and non-empty password', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'my-password',
      };
      const result = loginSchema.safeParse(validLogin);
      assert.equal(result.success, true);
    });

    it('rejects login with empty password', () => {
      const emptyPassLogin = {
        email: 'user@example.com',
        password: '',
      };
      const result = loginSchema.safeParse(emptyPassLogin);
      assert.equal(result.success, false);
    });

    it('validates password reset request payload', () => {
      const validReset = { email: 'user@example.com' };
      assert.equal(passwordResetRequestSchema.safeParse(validReset).success, true);

      const invalidReset = { email: 'bad-email' };
      assert.equal(passwordResetRequestSchema.safeParse(invalidReset).success, false);
    });

    it('validates password reset confirm schema', () => {
      const validConfirm = {
        password: 'NewStrongPassword123!',
        confirmPassword: 'NewStrongPassword123!',
      };
      assert.equal(passwordResetConfirmSchema.safeParse(validConfirm).success, true);

      const mismatchConfirm = {
        password: 'NewStrongPassword123!',
        confirmPassword: 'DifferentPassword456!',
      };
      assert.equal(passwordResetConfirmSchema.safeParse(mismatchConfirm).success, false);
    });
  });

  // =========================================================================
  // 2. Safe Redirect & URL Sanitization
  // =========================================================================
  describe('2. Open Redirect Prevention & URL Sanitization', () => {
    it('permits safe internal relative paths', () => {
      assert.equal(sanitizeRedirectUrl('/dashboard'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('/org/acme/elections/123'), '/org/acme/elections/123');
      assert.equal(sanitizeRedirectUrl('/voter?tab=active'), '/voter?tab=active');
    });

    it('rejects external absolute URLs and falls back to default', () => {
      assert.equal(sanitizeRedirectUrl('https://malicious-site.com'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('http://evil.com/phish'), '/dashboard');
    });

    it('rejects protocol-relative URLs (//)', () => {
      assert.equal(sanitizeRedirectUrl('//malicious.com/steal'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('/\\malicious.com'), '/dashboard');
    });

    it('rejects javascript: and script pseudo-protocols', () => {
      assert.equal(sanitizeRedirectUrl('javascript:alert(1)'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('/javascript:alert(1)'), '/dashboard');
    });

    it('falls back to custom default destination when provided', () => {
      assert.equal(sanitizeRedirectUrl('https://evil.com', '/onboarding'), '/onboarding');
      assert.equal(sanitizeRedirectUrl(null, '/voter'), '/voter');
    });
  });

  // =========================================================================
  // 3. Password Policy Evaluator
  // =========================================================================
  describe('3. Password Policy & Strength Rules', () => {
    it('identifies strong passwords meeting 12+ recommended character length', () => {
      const policy = evaluatePasswordPolicy('AlphaBetaGamma123!');
      assert.equal(policy.valid, true);
      assert.equal(policy.recommended, true);
      assert.equal(policy.hasLength, true);
      assert.equal(policy.hasRecommendedLength, true);
      assert.equal(policy.hasUppercase, true);
      assert.equal(policy.hasLowercase, true);
      assert.equal(policy.hasNumber, true);
      assert.equal(policy.hasSpecial, true);
      assert.equal(policy.score, 5);
    });

    it('flags passwords meeting minimum 8 chars but under recommended 12', () => {
      const policy = evaluatePasswordPolicy('Abc12345');
      assert.equal(policy.valid, true);
      assert.equal(policy.recommended, false);
      assert.equal(policy.hasRecommendedLength, false);
    });

    it('fails passwords shorter than 8 characters', () => {
      const policy = evaluatePasswordPolicy('Short1!');
      assert.equal(policy.valid, false);
      assert.equal(policy.hasLength, false);
    });
  });

  // =========================================================================
  // 4. Production Security & Dev Login Gate
  // =========================================================================
  describe('4. Dev Login Production Isolation', () => {
    it('disallows dev login when NODE_ENV is production', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalFlag = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN;

      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = 'true';

      assert.equal(isDevLoginAllowed(), false);

      process.env.NODE_ENV = originalEnv;
      process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = originalFlag;
    });

    it('disallows dev login when flag is false or unset in development', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalFlag = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN;

      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = 'false';
      assert.equal(isDevLoginAllowed(), false);

      delete process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN;
      assert.equal(isDevLoginAllowed(), false);

      process.env.NODE_ENV = originalEnv;
      process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = originalFlag;
    });
  });

  // =========================================================================
  // 5. Database Uniqueness & Voter Identity Model Schema
  // =========================================================================
  describe('5. Database Uniqueness & One-Vote Constraints', () => {
    it('enforces unique supabaseUserId in User model attributes/indexes', () => {
      const userAttributes = User.rawAttributes;
      assert.ok(userAttributes.supabaseUserId);
      assert.equal(userAttributes.supabaseUserId.unique, true);
    });

    it('enforces unique (orgId, userId) in Member model indexes', () => {
      const memberIndexes = Member.options.indexes || [];
      const hasUniqueOrgUserIndex = memberIndexes.some(
        (idx) =>
          idx.unique &&
          idx.fields &&
          idx.fields.includes('orgId') &&
          idx.fields.includes('userId')
      );
      assert.ok(
        hasUniqueOrgUserIndex,
        'Member model must enforce unique constraint on (orgId, userId)'
      );
    });

    it('enforces unique (electionId, memberId) in Eligibility model indexes', () => {
      const eligibilityIndexes = Eligibility.options.indexes || [];
      const hasUniqueElectionMemberIndex = eligibilityIndexes.some(
        (idx) =>
          idx.unique &&
          idx.fields &&
          idx.fields.includes('electionId') &&
          idx.fields.includes('memberId')
      );
      assert.ok(
        hasUniqueElectionMemberIndex,
        'Eligibility model must enforce unique constraint on (electionId, memberId)'
      );
    });
  });

  // =========================================================================
  // 6. Sliding-Window Rate Limiting Protection
  // =========================================================================
  describe('6. Sliding Window Rate Limiter', () => {
    it('allows requests within threshold and blocks excess requests', async () => {
      const { rateLimiter } = await import('../lib/security/rate-limiter.js');
      const testKey = 'test-ip-123';
      rateLimiter.reset(testKey);

      // Limit of 3 in a window
      const check1 = rateLimiter.check(testKey, { limit: 3, windowMs: 10000 });
      assert.equal(check1.allowed, true);
      assert.equal(check1.remaining, 2);

      const check2 = rateLimiter.check(testKey, { limit: 3, windowMs: 10000 });
      assert.equal(check2.allowed, true);
      assert.equal(check2.remaining, 1);

      const check3 = rateLimiter.check(testKey, { limit: 3, windowMs: 10000 });
      assert.equal(check3.allowed, true);
      assert.equal(check3.remaining, 0);

      // 4th request must be rejected
      const check4 = rateLimiter.check(testKey, { limit: 3, windowMs: 10000 });
      assert.equal(check4.allowed, false);
      assert.equal(check4.remaining, 0);

      rateLimiter.reset(testKey);
    });
  });
});

