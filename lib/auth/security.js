/**
 * Authentication and Redirection Security Utilities for VoteSphere.
 */

/**
 * Sanitizes and validates a redirect path to prevent open redirect vulnerabilities.
 * Ensures the target URL is strictly an internal relative path starting with '/'
 * and prevents protocol-relative ('//') or script injection paths.
 *
 * @param {string | null | undefined} target - The requested redirect destination
 * @param {string} [defaultUrl='/dashboard'] - Safe fallback destination
 * @returns {string} Sanitized safe relative URL
 */
export function sanitizeRedirectUrl(target, defaultUrl = '/dashboard') {
  if (!target || typeof target !== 'string') {
    return defaultUrl;
  }

  const trimmed = target.trim();

  // Must start with '/' and must NOT start with '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return defaultUrl;
  }

  // Prevent embedded protocol schemes like '/\example.com' or '/javascript:'
  if (/^[/\\]{2,}/.test(trimmed)) {
    return defaultUrl;
  }

  // Disallow control characters or carriage returns
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return defaultUrl;
  }

  // Ensure no explicit protocol indicator before the query or hash string
  const pathPart = trimmed.split(/[?#]/)[0];
  if (pathPart.includes(':') || pathPart.includes('\\')) {
    return defaultUrl;
  }

  return trimmed;
}

/**
 * Checks whether development-only test login personas should be accessible.
 * Strictly requires NODE_ENV === 'development' AND NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'.
 *
 * @returns {boolean}
 */
export function isDevLoginAllowed() {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'
  );
}

/**
 * Evaluates password strength according to VoteSphere security policy.
 * Recommended length is at least 12 characters.
 *
 * @param {string} password
 * @returns {{
 *   valid: boolean,
 *   recommended: boolean,
 *   hasLength: boolean,
 *   hasUppercase: boolean,
 *   hasLowercase: boolean,
 *   hasNumber: boolean,
 *   hasSpecial: boolean,
 *   score: number
 * }}
 */
export function evaluatePasswordPolicy(password = '') {
  const pwd = String(password || '');
  const hasLength = pwd.length >= 8;
  const hasRecommendedLength = pwd.length >= 12;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (hasRecommendedLength) score += 1;
  if (hasUppercase && hasLowercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  return {
    valid: hasLength,
    recommended: hasRecommendedLength,
    hasLength,
    hasRecommendedLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    score, // 0 to 5
  };
}
