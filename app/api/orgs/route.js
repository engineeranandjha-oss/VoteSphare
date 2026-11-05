import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { organizationCreateSchema } from '@/lib/validations';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, ConflictError, UnauthorizedError } from '@/lib/utils/error-handler';
import { Organization, Member, User, sequelize } from '@/models/index.js';
import { Op } from 'sequelize';

/**
 * POST /api/orgs
 * Create a new organization and assign the creator as the Owner.
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
    const validatedData = organizationCreateSchema.parse(body);

    // Check if slug already exists
    const existingOrg = await Organization.findOne({
      where: { slug: validatedData.slug.toLowerCase().trim() },
    });

    if (existingOrg) {
      throw new ConflictError('An organization with this slug already exists');
    }

    // Create organization and owner membership within a transaction
    const result = await sequelize.transaction(async (t) => {
      const organization = await Organization.create(
        {
          name: validatedData.name.trim(),
          slug: validatedData.slug.toLowerCase().trim(),
          type: validatedData.type || 'other',
          description: validatedData.description ? validatedData.description.trim() : null,
          logo: validatedData.logo ? validatedData.logo.trim() : null,
          ownerId: dbUser.id,
        },
        { transaction: t }
      );

      // Create owner member record
      await Member.create(
        {
          orgId: organization.id,
          userId: dbUser.id,
          role: 'owner',
          status: 'active',
          joinedAt: new Date(),
        },
        { transaction: t }
      );

      return organization;
    });

    return successResponse(result, 'Organization created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/orgs
 * List organizations the authenticated user owns or is an active member of.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      return successResponse([], 'Organizations retrieved successfully');
    }

    // Find all memberships of the user
    const memberships = await Member.findAll({
      where: {
        userId: dbUser.id,
        status: 'active',
      },
      attributes: ['orgId', 'role'],
    });

    const orgIds = memberships.map((m) => m.orgId);

    // Find organizations where user is owner OR member
    const organizations = await Organization.findAll({
      where: {
        [Op.or]: [{ ownerId: dbUser.id }, { id: { [Op.in]: orgIds } }],
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'image'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Attach current user's role to each organization object
    const roleMap = new Map(memberships.map((m) => [m.orgId, m.role]));

    const formattedOrgs = organizations.map((org) => {
      const plainOrg = org.toJSON();
      const userRole = org.ownerId === dbUser.id ? 'owner' : roleMap.get(org.id) || 'voter';
      return {
        ...plainOrg,
        userRole,
      };
    });

    return successResponse(formattedOrgs, 'Organizations retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
