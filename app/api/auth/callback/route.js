import { createClient } from '@/lib/supabase/server';
import { syncUser } from '@/lib/auth/user-sync';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/callback
 * Handles OAuth callback code exchange, session creation, and MySQL user profile sync.
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  if (error) {
    const errorMsg = error_description || error;
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorMsg)}`
    );
  }

  if (code) {
    const supabase = createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data?.session?.user) {
      // Sync user with MySQL database asynchronously
      await syncUser(data.session.user);
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }

    if (!exchangeError) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_failed`);
}
