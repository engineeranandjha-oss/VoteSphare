import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Signs out the current user session and redirects to /auth/login or returns JSON.
 */
async function handleLogout(request) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();

  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore signout error if session already expired
  }

  // If request is from fetch / AJAX, return JSON response
  if (request.method === 'POST' || request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth/login`, {
    status: 302,
  });
}

export async function POST(request) {
  return handleLogout(request);
}

export async function GET(request) {
  return handleLogout(request);
}
