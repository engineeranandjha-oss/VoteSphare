import { getAuthContext } from '@/lib/auth/session';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * GET /api/auth/session
 * Returns the current authenticated user's session and profile.
 */
export async function GET() {
  try {
    const { user, session, dbUser } = await getAuthContext();

    if (!user || !session) {
      return successResponse(
        {
          authenticated: false,
          user: null,
          dbUser: null,
        },
        'No active session',
        200
      );
    }

    return successResponse(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          userMetadata: user.user_metadata,
          appMetadata: user.app_metadata,
        },
        dbUser: dbUser
          ? {
              id: dbUser.id,
              supabaseUserId: dbUser.supabaseUserId,
              name: dbUser.name,
              email: dbUser.email,
              image: dbUser.image,
              createdAt: dbUser.createdAt,
            }
          : null,
        expiresAt: session.expires_at,
      },
      'Active session retrieved successfully',
      200
    );
  } catch (error) {
    return errorResponse(error.message || 'Failed to retrieve session', 500);
  }
}
