import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { getUserRole, requireOrgRole } from '@/lib/auth/authorization';
import { memberUpdateRoleSchema } from '@/lib/validations';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/utils/error-handler';
import { Member, Organization, User } from '@/models/index.js';

/**
 * GET /api/members/[memberId]
 * Retrieve member details, role, and status.
 */
export async function GET(request, { params }) {
  try {
    const { memberId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User profile synchronization failed');
    }

    const member = await Member.findByPk(memberId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'image'],
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'ownerId'],
        },
      ],
    });

    if (!member) {
      throw new NotFoundError('Member record not found');
    }

    // Verify caller belongs to the organization
    const callerRole = await getUserRole(member.orgId, dbUser.id);
    if (!callerRole) {
      throw new ForbiddenError('You do not have access to this organization member');
    }

    return successResponse(member, 'Member details retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/members/[memberId]
 * Update member role or status (Owner or Admin only).
 */
export async function PATCH(request, { params }) {
  try {
    const { memberId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User profile synchronization failed');
    }

    const member = await Member.findByPk(memberId, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'ownerId'],
        },
      ],
    });

    if (!member) {
      throw new NotFoundError('Member record not found');
    }

    // Require Owner or Admin role in the organization
    const callerRole = await requireOrgRole(dbUser.id, member.orgId, ['owner', 'admin']);

    // Prevent modifying the organization owner
    if (member.organization.ownerId === member.userId) {
      throw new ForbiddenError('The organization owner role cannot be modified here');
    }

    // If caller is Admin (not Owner), they cannot demote or modify other Admins
    if (callerRole === 'admin' && member.role === 'admin' && member.userId !== dbUser.id) {
      throw new ForbiddenError('Admins cannot modify permissions of other admins');
    }

    const body = await request.json();
    const validatedData = memberUpdateRoleSchema.parse(body);

    // Only owners can grant the owner role
    if (validatedData.role === 'owner' && callerRole !== 'owner') {
      throw new ForbiddenError('Only the organization owner can assign the owner role');
    }

    if (validatedData.role) {
      member.role = validatedData.role;
    }

    if (validatedData.status) {
      member.status = validatedData.status;
    }

    await member.save();

    const updatedMember = await Member.findByPk(member.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'image'],
        },
      ],
    });

    return successResponse(updatedMember, 'Member updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/members/[memberId]
 * Remove member from organization (Owner, Admin, or the member themselves).
 */
export async function DELETE(request, { params }) {
  try {
    const { memberId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User profile synchronization failed');
    }

    const member = await Member.findByPk(memberId, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'ownerId'],
        },
      ],
    });

    if (!member) {
      throw new NotFoundError('Member record not found');
    }

    // Protect the owner from being deleted
    if (member.organization.ownerId === member.userId) {
      throw new ForbiddenError('The organization owner cannot be removed. Transfer ownership first.');
    }

    const callerRole = await getUserRole(member.orgId, dbUser.id);
    const isSelf = member.userId === dbUser.id;
    const isPrivileged = callerRole === 'owner' || callerRole === 'admin';

    if (!isSelf && !isPrivileged) {
      throw new ForbiddenError('You do not have permission to remove this member');
    }

    // Admins cannot remove other Admins
    if (callerRole === 'admin' && member.role === 'admin' && !isSelf) {
      throw new ForbiddenError('Admins cannot remove other admins');
    }

    await member.destroy();

    return successResponse(null, 'Member removed successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
