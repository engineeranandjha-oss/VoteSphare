import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { verifyInviteToken } from '@/lib/email/invitation';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from '@/lib/utils/error-handler';
import { Organization, Member } from '@/models/index.js';

/**
 * POST /api/orgs/join
 * Accepts an organization invitation token and joins the organization.
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User profile synchronization failed');
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      throw new ValidationError('Invitation token is required');
    }

    const verification = verifyInviteToken(token);

    if (!verification.valid || !verification.data) {
      throw new ValidationError(verification.error || 'Invalid or expired invitation token');
    }

    const { orgId, role } = verification.data;

    const organization = await Organization.findByPk(orgId);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Find or create member record
    let member = await Member.findOne({
      where: {
        orgId: organization.id,
        userId: dbUser.id,
      },
    });

    if (member) {
      // If already active member, update role if the invite grants admin role
      if (role === 'admin' && member.role === 'voter') {
        member.role = 'admin';
      }
      member.status = 'active';
      await member.save();
    } else {
      member = await Member.create({
        orgId: organization.id,
        userId: dbUser.id,
        role: role || 'voter',
        status: 'active',
        joinedAt: new Date(),
      });
    }

    return successResponse(
      {
        orgId: organization.id,
        slug: organization.slug,
        orgName: organization.name,
        role: member.role,
        joinedAt: member.joinedAt,
      },
      'Joined organization successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
