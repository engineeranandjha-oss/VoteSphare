import { autoTransitionElections } from '@/lib/elections/lifecycle';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError } from '@/lib/utils/error-handler';
import { env } from '@/lib/env';

/**
 * GET /api/cron/elections
 * Cron endpoint to automatically transition scheduled and live elections based on time.
 */
export async function GET(request) {
  try {
    // Optional secret verification if CRON_SECRET is configured
    const authHeader = request.headers.get('authorization');
    if (env.CRON_SECRET) {
      if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        throw new UnauthorizedError('Invalid cron secret');
      }
    }

    const result = await autoTransitionElections();
    return successResponse(result, 'Auto-transition process completed');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/cron/elections
 * Allows manual or webhook POST trigger of the election transitions.
 */
export async function POST(request) {
  return GET(request);
}
