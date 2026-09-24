import { getCurrentDbUser } from '@/lib/auth/session';
import { canManageElection } from '@/lib/auth/authorization';
import { GET as getAdminResults } from './admin/route';
import { GET as getPublicResults } from './public/route';

/**
 * GET /api/elections/[electionId]/results
 * Unified endpoint dynamically returning admin results or certified public results.
 */
export async function GET(request, context) {
  try {
    const { electionId } = context.params;
    const dbUser = await getCurrentDbUser();

    if (dbUser) {
      const isManager = await canManageElection(dbUser.id, electionId);
      if (isManager) {
        return getAdminResults(request, context);
      }
    }

    return getPublicResults(request, context);
  } catch {
    return getPublicResults(request, context);
  }
}
