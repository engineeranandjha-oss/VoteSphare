import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Signs out the current user session and redirects to /login.
 */
async function handleLogout(request) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    status: 302,
  });
}

export async function POST(request) {
  return handleLogout(request);
}

export async function GET(request) {
  return handleLogout(request);
}
