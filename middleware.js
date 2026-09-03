import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';

// Route patterns that require authentication
const PROTECTED_PREFIXES = ['/org', '/admin', '/dashboard'];

// Auth-only route prefixes (e.g. login page)
const AUTH_ONLY_PREFIXES = ['/login'];

/**
 * Next.js Middleware to refresh Supabase auth session and enforce route protection.
 *
 * @param {import('next/server').NextRequest} request
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const isAuthOnlyRoute = AUTH_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // 1. If trying to access a protected route without being authenticated -> redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already authenticated and trying to access auth pages (like /login) -> redirect to dashboard
  if (isAuthOnlyRoute && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.searchParams.delete('next');
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static asset extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
