import { createClient } from '@/lib/supabase/server';
import { UnauthorizedError } from '@/lib/utils/error-handler';
import { User } from '@/models/index.js';

/**
 * Retrieves the active session from Supabase in Server Components, Route Handlers, or Server Actions.
 *
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

/**
 * Retrieves the currently authenticated Supabase user on the server.
 * Uses `supabase.auth.getUser()` to safely re-validate the token against Supabase Auth server.
 *
 * @returns {Promise<import('@supabase/supabase-js').User | null>}
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Retrieves the MySQL User database model corresponding to the currently authenticated Supabase user.
 *
 * @returns {Promise<import('@/models/user.js').User | null>}
 */
export async function getCurrentDbUser() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const dbUser = await User.findOne({
      where: { supabaseUserId: user.id },
    });

    return dbUser;
  } catch {
    return null;
  }
}

/**
 * Checks if the current request is from an authenticated user.
 *
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return Boolean(user);
}

/**
 * Enforces authentication in server components, API routes, or server actions.
 * Throws UnauthorizedError if no active user is found.
 *
 * @throws {UnauthorizedError}
 * @returns {Promise<import('@supabase/supabase-js').User>}
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError('Authentication required to access this resource');
  }

  return user;
}

/**
 * Retrieves full authentication context (Supabase User, Session, and MySQL DB User).
 *
 * @returns {Promise<{ user: any, session: any, dbUser: any }>}
 */
export async function getAuthContext() {
  const [user, session, dbUser] = await Promise.all([
    getCurrentUser(),
    getSession(),
    getCurrentDbUser(),
  ]);

  return {
    user,
    session,
    dbUser,
  };
}

/**
 * Explicitly triggers a session refresh on the server.
 *
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
export async function refreshSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession();

  if (error || !session) {
    return null;
  }

  return session;
}
