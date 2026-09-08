import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireOrgRole } from '@/lib/auth/authorization';
import { successResponse, paginatedResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Organization, Member, User } from '@/models/index.js';
import { z } from 'zod';

const addMemberSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().uuid().optional(),
  role: z.enum(['admin', 'voter']).default('voter'),
  status: z.enum(['active', 'pending', 'suspended']).default('active'),
});

/**
 * GET /api/orgs/[orgId]/members
 * List members of an organization with pagination and optional filtering.
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

    // Resolve organization by UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
    const organization = await Organization.findOne({
      where: isUUID ? { id: orgId } : { slug: orgId.toLowerCase() },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Require caller to be at least a member or owner
    await requireOrgRole(dbUser.id, organization.id, ['owner', 'admin', 'voter']);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status') || 'active';

    const whereClause = {
      orgId: organization.id,
    };

    if (roleFilter && ['owner', 'admin', 'voter'].includes(roleFilter)) {
      whereClause.role = roleFilter;
    }

    if (statusFilter && ['active', 'pending', 'suspended', 'all'].includes(statusFilter)) {
      if (statusFilter !== 'all') {
        whereClause.status = statusFilter;
      }
    }

    const { count, rows: members } = await Member.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'image'],
        },
      ],
      order: [
        ['role', 'ASC'], // 'admin' / 'owner' / 'voter'
        ['createdAt', 'ASC'],
      ],
      offset: (page - 1) * limit,
      limit,
    });

    return paginatedResponse(
      members,
      {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      'Organization members retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/orgs/[orgId]/members
 * Add a member to the organization (Owner or Admin only).
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

    // Enforce Owner or Admin role to add members
    await requireOrgRole(dbUser.id, organization.id, ['owner', 'admin']);

    const body = await request.json();
    const validatedData = addMemberSchema.parse(body);

    if (!validatedData.userId && !validatedData.email) {
      throw new ValidationError('Either userId or email must be provided to add a member');
    }

    let targetUser = null;

    if (validatedData.userId) {
      targetUser = await User.findByPk(validatedData.userId);
    } else if (validatedData.email) {
      targetUser = await User.findOne({
        where: { email: validatedData.email.toLowerCase().trim() },
      });

      // If user has not signed in yet, we can create a placeholder user record
      if (!targetUser) {
        targetUser = await User.create({
          supabaseUserId: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          email: validatedData.email.toLowerCase().trim(),
          name: validatedData.email.split('@')[0],
        });
      }
    }

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check if membership already exists
    let member = await Member.findOne({
      where: {
        orgId: organization.id,
        userId: targetUser.id,
      },
    });

    if (member) {
      if (member.status === 'active') {
        throw new ConflictError('User is already an active member of this organization');
      }

      // Re-activate suspended or pending member
      member.status = validatedData.status || 'active';
      member.role = validatedData.role || member.role;
      await member.save();
    } else {
      // Create new member
      member = await Member.create({
        orgId: organization.id,
        userId: targetUser.id,
        role: validatedData.role || 'voter',
        status: validatedData.status || 'active',
        joinedAt: new Date(),
      });
    }

    const fullMember = await Member.findByPk(member.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'image'],
        },
      ],
    });

    return successResponse(fullMember, 'Member added successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
