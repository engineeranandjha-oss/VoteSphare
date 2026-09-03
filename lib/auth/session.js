import { createClient } from '@/lib/supabase/server';
import { UnauthorizedError } from '@/lib/utils/error-handler';

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
