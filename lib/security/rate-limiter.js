/**
 * In-Memory Sliding-Window Rate Limiter for VoteSphere Authentication & Voting Routes.
 * Ready for Redis / Upstash pluggable cache backends.
 */

class SlidingWindowRateLimiter {
  constructor() {
    /** @type {Map<string, number[]>} */
    this.storage = new Map();
    // Periodically clean stale records every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000).unref?.();
    }
  }

  /**
   * Evaluates if a request is allowed under the rate limit policy.
   *
   * @param {string} key - Identifier (e.g., `login:${ip}`, `vote:${userId}`, `magic-link:${ip}`)
   * @param {object} options
   * @param {number} options.limit - Max requests permitted in the window
   * @param {number} options.windowMs - Time window in milliseconds
   * @returns {{
   *   allowed: boolean,
   *   limit: number,
   *   remaining: number,
   *   resetMs: number
   * }}
   */
  check(key, { limit = 10, windowMs = 60 * 1000 } = {}) {
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = this.storage.get(key) || [];
    // Filter out timestamps outside the active window
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= limit) {
      const oldestInWindow = validTimestamps[0];
      const resetMs = oldestInWindow + windowMs - now;
      this.storage.set(key, validTimestamps);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetMs: Math.max(resetMs, 1000),
      };
    }

    validTimestamps.push(now);
    this.storage.set(key, validTimestamps);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - validTimestamps.length),
      resetMs: windowMs,
    };
  }

  /**
   * Resets rate limits for a specific key (useful after successful auth or during tests)
   * @param {string} key
   */
  reset(key) {
    this.storage.delete(key);
  }

  /**
   * Cleans expired entries from memory.
   */
  cleanup() {
    const now = Date.now();
    const maxRetention = 60 * 60 * 1000; // 1 hour max retention
    for (const [key, timestamps] of this.storage.entries()) {
      const filtered = timestamps.filter((t) => t > now - maxRetention);
      if (filtered.length === 0) {
        this.storage.delete(key);
      } else {
        this.storage.set(key, filtered);
      }
    }
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();

/**
 * Standardized Rate Limiting Presets for Platform Security
 */
export const RateLimitPresets = {
  // Login: 10 attempts per minute
  AUTH_LOGIN: { limit: 10, windowMs: 60 * 1000 },
  // Signup: 5 attempts per 10 minutes
  AUTH_SIGNUP: { limit: 5, windowMs: 10 * 60 * 1000 },
  // Magic Link / OTP dispatch: 3 requests per 5 minutes
  AUTH_MAGIC_LINK: { limit: 3, windowMs: 5 * 60 * 1000 },
  // Password Reset: 3 requests per 15 minutes
  AUTH_PASSWORD_RESET: { limit: 3, windowMs: 15 * 60 * 1000 },
  // Vote Submission: 5 submissions per minute per user
  BALLOT_SUBMISSION: { limit: 5, windowMs: 60 * 1000 },
  // Invitation Acceptance: 10 attempts per minute
  INVITATION_ACCEPT: { limit: 10, windowMs: 60 * 1000 },
};

/**
 * Extracts client IP or identity key from Request.
 *
 * @param {Request} request
 * @param {string} [fallbackKey='anonymous']
 * @returns {string}
 */
export function getClientIp(request, fallbackKey = 'anonymous') {
  if (!request) return fallbackKey;
  const forwarded = request.headers?.get?.('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers?.get?.('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return fallbackKey;
}
