import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireOrgRole } from '@/lib/auth/authorization';
import { generateInviteToken, sendInvitationEmail } from '@/lib/email/invitation';
import { memberInviteSchema } from '@/lib/validations';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from '@/lib/utils/error-handler';
import { Organization, Member, User } from '@/models/index.js';

/**
 * POST /api/orgs/[orgId]/invite
 * Generate and dispatch an organization membership invitation.
 */
export async function POST(request, { params }) {
  try {
    const { orgId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User profile synchronization failed');
    }

    // Resolve organization by UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
    const organization = await Organization.findOne({
      where: isUUID ? { id: orgId } : { slug: orgId.toLowerCase() },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Require Owner or Admin role
    await requireOrgRole(dbUser.id, organization.id, ['owner', 'admin']);

    const body = await request.json();
    const { email, role } = memberInviteSchema.parse(body);
    const cleanEmail = email.toLowerCase().trim();

    // Check if user is already an active member
    let existingUser = await User.findOne({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      const existingMember = await Member.findOne({
        where: {
          orgId: organization.id,
          userId: existingUser.id,
          status: 'active',
        },
      });

      if (existingMember) {
        throw new ConflictError('User is already an active member of this organization');
      }
    } else {
      // Create pending placeholder user if not existing
      existingUser = await User.create({
        supabaseUserId: `invite_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
      });
    }

    // Create or update pending member record
    let member = await Member.findOne({
      where: {
        orgId: organization.id,
        userId: existingUser.id,
      },
    });

    if (!member) {
      member = await Member.create({
        orgId: organization.id,
        userId: existingUser.id,
        role: role || 'voter',
        status: 'pending',
      });
    } else {
      member.role = role || member.role;
      member.status = 'pending';
      await member.save();
    }

    // Generate signed token
    const token = generateInviteToken({
      orgId: organization.id,
      email: cleanEmail,
      role: role || 'voter',
      expiresInDays: 7,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/join/${token}`;

    // Dispatch email
    const emailResult = await sendInvitationEmail({
      email: cleanEmail,
      orgName: organization.name,
      inviterName: dbUser.name || 'An administrator',
      role: role || 'voter',
      inviteLink,
    });

    const emailSent = Boolean(emailResult?.success);
    const emailMessage = emailResult?.deliveryDisabled
      ? 'Email delivery is disabled on this server. Direct invitation link is ready to share.'
      : emailResult?.error
      ? `Email delivery could not be completed (${emailResult.error}). Direct invitation link is ready to share.`
      : 'Invitation email successfully delivered to recipient inbox.';

    return successResponse(
      {
        email: cleanEmail,
        role: role || 'voter',
        token,
        inviteLink,
        expiresInDays: 7,
        emailSent,
        emailMessage,
        messageId: emailResult?.id || null,
      },
      emailSent
        ? 'Invitation email sent successfully'
        : 'Member invited. Please copy and share the direct invitation link.',
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
