import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  rateLimiter,
  RateLimitPresets,
  getClientIp,
} from '../lib/security/rate-limiter.js';
import { TooManyRequestsError } from '../lib/utils/error-handler.js';

describe('VoteSphere Module 14.6: Rate Limiting & Anti-Abuse Test Suite', () => {
  // =========================================================================
  // 1. Sliding Window Core Mechanics
  // =========================================================================
  describe('1. Sliding Window Mechanics & Capacity Boundaries', () => {
    test('allows requests within threshold and tracks remaining quota accurately', () => {
      const key = 'test:client-allow:1';
      rateLimiter.reset(key);

      const limit = 5;
      const windowMs = 10000;

      for (let i = 1; i <= limit; i++) {
        const res = rateLimiter.check(key, { limit, windowMs });
        assert.equal(res.allowed, true, `Request ${i} should be allowed`);
        assert.equal(res.remaining, limit - i);
        assert.equal(res.limit, limit);
        assert.ok(res.resetMs > 0 && res.resetMs <= windowMs);
      }

      // Next request must be blocked
      const blockedRes = rateLimiter.check(key, { limit, windowMs });
      assert.equal(blockedRes.allowed, false);
      assert.equal(blockedRes.remaining, 0);
      assert.ok(blockedRes.resetMs > 0);
    });

    test('resets quota when explicitly requested', () => {
      const key = 'test:client-reset:2';
      rateLimiter.reset(key);

      const limit = 2;
      const windowMs = 5000;

      // Exhaust limit
      rateLimiter.check(key, { limit, windowMs });
      rateLimiter.check(key, { limit, windowMs });
      assert.equal(rateLimiter.check(key, { limit, windowMs }).allowed, false);

      // Reset and verify immediate replenishment
      rateLimiter.reset(key);
      const res = rateLimiter.check(key, { limit, windowMs });
      assert.equal(res.allowed, true);
      assert.equal(res.remaining, 1);
    });

    test('isolates different keys independently', () => {
      const keyA = 'ip:198.51.100.1';
      const keyB = 'ip:198.51.100.2';
      rateLimiter.reset(keyA);
      rateLimiter.reset(keyB);

      const limit = 2;
      const windowMs = 5000;

      // Exhaust keyA
      rateLimiter.check(keyA, { limit, windowMs });
      rateLimiter.check(keyA, { limit, windowMs });
      assert.equal(rateLimiter.check(keyA, { limit, windowMs }).allowed, false);

      // keyB must still have full capacity
      const resB = rateLimiter.check(keyB, { limit, windowMs });
      assert.equal(resB.allowed, true);
      assert.equal(resB.remaining, 1);
    });
  });

  // =========================================================================
  // 2. Standard Platform Rate Limit Presets
  // =========================================================================
  describe('2. Security Presets Configuration', () => {
    test('enforces AUTH_LOGIN preset (10 req / 60s)', () => {
      const key = 'login:test-user';
      rateLimiter.reset(key);

      const { limit, windowMs } = RateLimitPresets.AUTH_LOGIN;
      assert.equal(limit, 10);
      assert.equal(windowMs, 60000);

      for (let i = 0; i < 10; i++) {
        assert.equal(rateLimiter.check(key, RateLimitPresets.AUTH_LOGIN).allowed, true);
      }
      assert.equal(rateLimiter.check(key, RateLimitPresets.AUTH_LOGIN).allowed, false);
    });

    test('enforces AUTH_SIGNUP preset (5 req / 10m)', () => {
      const key = 'signup:test-ip';
      rateLimiter.reset(key);

      const { limit, windowMs } = RateLimitPresets.AUTH_SIGNUP;
      assert.equal(limit, 5);
      assert.equal(windowMs, 600000);

      for (let i = 0; i < 5; i++) {
        assert.equal(rateLimiter.check(key, RateLimitPresets.AUTH_SIGNUP).allowed, true);
      }
      assert.equal(rateLimiter.check(key, RateLimitPresets.AUTH_SIGNUP).allowed, false);
    });

    test('enforces BALLOT_SUBMISSION preset (5 req / 60s)', () => {
      const key = 'ballot:elector-session-1';
      rateLimiter.reset(key);

      const { limit, windowMs } = RateLimitPresets.BALLOT_SUBMISSION;
      assert.equal(limit, 5);
      assert.equal(windowMs, 60000);

      for (let i = 0; i < 5; i++) {
        assert.equal(rateLimiter.check(key, RateLimitPresets.BALLOT_SUBMISSION).allowed, true);
      }
      assert.equal(rateLimiter.check(key, RateLimitPresets.BALLOT_SUBMISSION).allowed, false);
    });
  });

  // =========================================================================
  // 3. Client IP Extraction & Header Spoofing Resistance
  // =========================================================================
  describe('3. Client IP Identification & Proxy Handling', () => {
    test('extracts client IP from x-forwarded-for header with upstream proxy chain', () => {
      const mockReq = {
        headers: new Headers({
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        }),
      };
      const ip = getClientIp(mockReq);
      assert.equal(ip, '203.0.113.195');
    });

    test('falls back to x-real-ip if x-forwarded-for is missing', () => {
      const mockReq = {
        headers: new Headers({
          'x-real-ip': '198.51.100.42',
        }),
      };
      const ip = getClientIp(mockReq);
      assert.equal(ip, '198.51.100.42');
    });

    test('returns custom fallback when headers are absent or request is null', () => {
      assert.equal(getClientIp(null, 'default-fallback'), 'default-fallback');
      assert.equal(getClientIp({}, 'default-fallback'), 'default-fallback');
    });
  });

  // =========================================================================
  // 4. Rate Limiting Error Responses & Retry-After Headers
  // =========================================================================
  describe('4. Rate Limit Error Handling', () => {
    test('constructs TooManyRequestsError with retryAfter seconds', () => {
      const err = new TooManyRequestsError('Rate limit exceeded', 45);
      assert.equal(err.statusCode, 429);
      assert.equal(err.retryAfter, 45);
      assert.equal(err.message, 'Rate limit exceeded');
    });
  });
});
