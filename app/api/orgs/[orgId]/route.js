import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { getUserRole, requireOrgRole } from '@/lib/auth/authorization';
import { organizationUpdateSchema } from '@/lib/validations';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
} from '@/lib/utils/error-handler';
import { Organization, User, Member } from '@/models/index.js';
import { Op } from 'sequelize';

/**
 * GET /api/orgs/[orgId]
 * Get organization details, member count, and user's role.
 */
export async function GET(request, { params }) {
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

    // Find organization by ID or Slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);

    const organization = await Organization.findOne({
      where: isUUID ? { id: orgId } : { slug: orgId.toLowerCase() },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'image'],
        },
      ],
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    const userRole = await getUserRole(organization.id, dbUser.id);

    if (!userRole) {
      throw new ForbiddenError('You are not a member of this organization');
    }

    const memberCount = await Member.count({
      where: { orgId: organization.id, status: 'active' },
    });

    const data = {
      ...organization.toJSON(),
      memberCount,
      userRole,
    };

    return successResponse(data, 'Organization details retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/orgs/[orgId]
 * Update organization settings (Owner or Admin only).
 */
export async function PATCH(request, { params }) {
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

    const organization = await Organization.findByPk(orgId);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Require Owner or Admin role
    await requireOrgRole(dbUser.id, organization.id, ['owner', 'admin']);

    const body = await request.json();
    const validatedData = organizationUpdateSchema.parse(body);

    // If slug is being updated, check for uniqueness
    if (validatedData.slug && validatedData.slug.toLowerCase().trim() !== organization.slug) {
      const slugExists = await Organization.findOne({
        where: {
          slug: validatedData.slug.toLowerCase().trim(),
          id: { [Op.ne]: organization.id },
        },
      });

      if (slugExists) {
        throw new ConflictError('An organization with this slug already exists');
      }

      organization.slug = validatedData.slug.toLowerCase().trim();
    }

    if (validatedData.name) {
      organization.name = validatedData.name.trim();
    }

    if (validatedData.type) {
      organization.type = validatedData.type;
    }

    if (validatedData.description !== undefined) {
      organization.description = validatedData.description
        ? validatedData.description.trim()
        : null;
    }

    if (validatedData.logo !== undefined) {
      organization.logo = validatedData.logo ? validatedData.logo.trim() : null;
    }

    await organization.save();

    return successResponse(organization, 'Organization updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/orgs/[orgId]
 * Delete organization (Owner only).
 */
export async function DELETE(request, { params }) {
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

    const organization = await Organization.findByPk(orgId);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Only Owner can delete the organization
    await requireOrgRole(dbUser.id, organization.id, ['owner']);

    await organization.destroy();

    return successResponse(null, 'Organization deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
