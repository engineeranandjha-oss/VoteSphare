import crypto from 'crypto';
import { env } from '../env.js';
import { checkEligibility } from './eligibility-check.js';
import { ForbiddenError, ValidationError, UnauthorizedError } from '../utils/error-handler.js';

const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes
const SECRET_KEY = env.INVITATION_SECRET || env.JWT_SECRET || 'votesphere-voting-session-secret-key';

/**
 * In-memory active voting session store
 * Key: `${userId}:${electionId}` -> Session Object
 */
const sessionStore = new Map();

/**
 * Consumed session IDs to prevent token replay
 * Set of sessionId
 */
const consumedSessions = new Set();

/**
 * Periodically purge expired sessions from memory
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of sessionStore.entries()) {
    if (session.expiresAt <= now) {
      sessionStore.delete(key);
    }
  }
  // Cap consumed sessions set size to prevent memory leaks
  if (consumedSessions.size > 10000) {
    consumedSessions.clear();
  }
}, 60 * 1000).unref();

/**
 * Generates an HMAC-SHA256 signed voting token
 *
 * @param {object} payload
 * @returns {string} Signed token
 */
function signToken(payload) {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadStr)
    .digest('hex');
  return `${payloadStr}.${signature}`;
}

/**
 * Starts or retrieves an active 15-minute voting session for an eligible voter.
 *
 * @param {string} userId - User UUID
 * @param {string} electionId - Election UUID
 * @returns {Promise<{
 *   sessionId: string,
 *   sessionToken: string,
 *   eligibilityId: string,
 *   electionId: string,
 *   electionTitle: string,
 *   expiresAt: number,
 *   expiresInSeconds: number,
 *   isNewSession: boolean
 * }>}
 */
export async function startVotingSession(userId, electionId) {
  if (!userId || !electionId) {
    throw new ValidationError('User ID and Election ID are required');
  }

  // 1. Verify Voter Eligibility
  const check = await checkEligibility(userId, electionId);
  if (!check.eligible) {
    throw new ForbiddenError(check.reason || 'Not eligible to vote in this election');
  }

  const sessionKey = `${userId}:${electionId}`;
  const now = Date.now();

  // 2. Check for existing active session
  const existingSession = sessionStore.get(sessionKey);
  if (existingSession && existingSession.expiresAt > now) {
    const remainingSeconds = Math.max(0, Math.floor((existingSession.expiresAt - now) / 1000));
    return {
      sessionId: existingSession.sessionId,
      sessionToken: existingSession.sessionToken,
      eligibilityId: existingSession.eligibilityId,
      electionId: existingSession.electionId,
      electionTitle: check.electionTitle,
      expiresAt: existingSession.expiresAt,
      expiresInSeconds: remainingSeconds,
      isNewSession: false,
    };
  }

  // 3. Create fresh session
  const sessionId = crypto.randomUUID();
  const expiresAt = now + SESSION_TTL_MS;

  const payload = {
    sessionId,
    userId,
    electionId,
    eligibilityId: check.eligibilityId,
    createdAt: now,
    expiresAt,
  };

  const sessionToken = signToken(payload);

  const sessionData = {
    ...payload,
    sessionToken,
    electionTitle: check.electionTitle,
  };

  sessionStore.set(sessionKey, sessionData);

  return {
    sessionId,
    sessionToken,
    eligibilityId: check.eligibilityId,
    electionId,
    electionTitle: check.electionTitle,
    expiresAt,
    expiresInSeconds: Math.floor(SESSION_TTL_MS / 1000),
    isNewSession: true,
  };
}

/**
 * Gets the current active voting session for a user and election if valid.
 *
 * @param {string} userId - User UUID
 * @param {string} electionId - Election UUID
 * @returns {{ sessionId: string, sessionToken: string, expiresAt: number, remainingSeconds: number } | null}
 */
export function getVotingSession(userId, electionId) {
  const sessionKey = `${userId}:${electionId}`;
  const session = sessionStore.get(sessionKey);
  if (!session) {
    return null;
  }

  const now = Date.now();
  if (session.expiresAt <= now) {
    sessionStore.delete(sessionKey);
    return null;
  }

  return {
    sessionId: session.sessionId,
    sessionToken: session.sessionToken,
    eligibilityId: session.eligibilityId,
    electionId: session.electionId,
    expiresAt: session.expiresAt,
    remainingSeconds: Math.floor((session.expiresAt - now) / 1000),
  };
}

/**
 * Cryptographically verifies and validates a voting session token.
 *
 * @param {string} token - Signed session token
 * @throws {UnauthorizedError | ValidationError}
 * @returns {{ sessionId: string, userId: string, electionId: string, eligibilityId: string, expiresAt: number }}
 */
export function verifyVotingSessionToken(token) {
  if (!token || typeof token !== 'string') {
    throw new UnauthorizedError('Voting session token is required');
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new UnauthorizedError('Malformed voting session token');
  }

  const [payloadStr, providedSig] = parts;

  const expectedSig = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadStr)
    .digest('hex');

  const providedBuffer = Buffer.from(providedSig, 'utf8');
  const expectedBuffer = Buffer.from(expectedSig, 'utf8');

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new UnauthorizedError('Invalid voting token signature');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
  } catch {
    throw new UnauthorizedError('Failed to parse token payload');
  }

  if (Date.now() > payload.expiresAt) {
    throw new UnauthorizedError('Voting session has expired (15-minute limit exceeded)');
  }

  if (consumedSessions.has(payload.sessionId)) {
    throw new UnauthorizedError('This voting session token has already been consumed');
  }

  return payload;
}

/**
 * Marks a voting session completed and consumes its token so it cannot be re-used.
 *
 * @param {string} sessionId - Session ID or token payload
 * @param {string} [userId] - User UUID
 * @param {string} [electionId] - Election UUID
 */
export function completeVotingSession(sessionId, userId = null, electionId = null) {
  if (sessionId) {
    consumedSessions.add(sessionId);
  }
  if (userId && electionId) {
    sessionStore.delete(`${userId}:${electionId}`);
  }
}

/**
 * Expires/invalidates an in-progress voting session.
 *
 * @param {string} userId - User UUID
 * @param {string} electionId - Election UUID
 */
export function expireVotingSession(userId, electionId) {
  const sessionKey = `${userId}:${electionId}`;
  const session = sessionStore.get(sessionKey);
  if (session) {
    consumedSessions.add(session.sessionId);
    sessionStore.delete(sessionKey);
  }
}
