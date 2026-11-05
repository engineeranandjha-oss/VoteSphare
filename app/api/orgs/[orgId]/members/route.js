import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireOrgRole, getUserRole } from '@/lib/auth/authorization';
import { successResponse, paginatedResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/utils/error-handler';
import { Organization, Member, User, Election, Eligibility } from '@/models/index.js';
import { Op } from 'sequelize';
import { z } from 'zod';

const addMemberSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().uuid().optional(),
  role: z.enum(['admin', 'voter']).default('voter'),
  status: z.enum(['active', 'pending', 'suspended']).default('active'),
});

/**
 * GET /api/orgs/[orgId]/members
 * List members of an organization with search, filtering, sorting, and privacy controls.
 */
export async function GET(request, { params }) {
  try {
    const { orgId } = params;

    // Resolve organization by UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
    const organization = await Organization.findOne({
      where: isUUID ? { id: orgId } : { slug: orgId.toLowerCase() },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Determine caller identity & role
    let callerUser = null;
    let callerRole = null;
    try {
      const user = await requireAuth();
      callerUser = await getCurrentDbUser();
      if (!callerUser && user) {
        callerUser = await syncUser(user);
      }
      if (callerUser) {
        callerRole = await getUserRole(organization.id, callerUser.id);

        // Check if user is an eligible voter in this organization's elections
        if (!callerRole) {
          const orgElections = await Election.findAll({
            where: { orgId: organization.id },
            attributes: ['id'],
            raw: true,
          });
          const electionIds = orgElections.map((e) => e.id);
          if (electionIds.length > 0) {
            const hasEligibility = await Eligibility.findOne({
              where: { electionId: { [Op.in]: electionIds } },
              include: [
                {
                  model: Member,
                  as: 'member',
                  where: { userId: callerUser.id },
                  attributes: ['id'],
                },
              ],
              attributes: ['id'],
            });
            if (hasEligibility) {
              callerRole = 'voter';
            }
          }
        }
      }
    } catch {
      // Unauthenticated visitor
    }

    const isMember = callerRole === 'owner' || callerRole === 'admin' || callerRole === 'voter';
    const isAdmin = callerRole === 'owner' || callerRole === 'admin';
    const isPublicDirectory = organization.memberDirectoryVisibility === 'public';

    // Privacy Gate: If not public and caller is not a member or voter, access is forbidden
    if (!isMember && !isPublicDirectory) {
      if (!callerUser) {
        throw new UnauthorizedError('Authentication required to access member directory');
      }
      throw new ForbiddenError('You do not have permission to view this organization’s member directory');
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status') || (isAdmin ? 'all' : 'active');
    const sortBy = searchParams.get('sortBy') || 'joinedAt'; // 'name', 'joinedAt', 'role'
    const sortOrder = searchParams.get('sortOrder')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = {
      orgId: organization.id,
    };

    if (roleFilter && ['owner', 'admin', 'voter'].includes(roleFilter)) {
      whereClause.role = roleFilter;
    }

    // Non-admins can strictly only view active members
    if (!isAdmin) {
      whereClause.status = 'active';
    } else if (statusFilter && ['active', 'pending', 'suspended', 'all'].includes(statusFilter)) {
      if (statusFilter !== 'all') {
        whereClause.status = statusFilter;
      }
    }

    // User search condition
    const userWhereClause = {};
    if (search) {
      const searchConditions = [
        { name: { [Op.like]: `%${search}%` } },
        { displayName: { [Op.like]: `%${search}%` } },
      ];
      if (isAdmin) {
        searchConditions.push({ email: { [Op.like]: `%${search}%` } });
      }
      userWhereClause[Op.or] = searchConditions;
    }

    // Determine sorting
    let orderClause = [['createdAt', 'DESC']];
    if (sortBy === 'name') {
      orderClause = [[{ model: User, as: 'user' }, 'name', sortOrder]];
    } else if (sortBy === 'role') {
      orderClause = [['role', sortOrder], ['createdAt', 'ASC']];
    } else {
      orderClause = [['createdAt', sortOrder]];
    }

    const { count, rows: rawMembers } = await Member.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhereClause).length > 0 ? userWhereClause : undefined,
          attributes: [
            'id',
            'name',
            'displayName',
            'email',
            'phone',
            'image',
            'designation',
            'bio',
            'showEmailPublicly',
            'showPhonePublicly',
            'avatarVisible',
          ],
        },
      ],
      order: orderClause,
      offset: (page - 1) * limit,
      limit,
    });

    // Serialize member items with privacy sanitization
    const sanitizedMembers = rawMembers.map((m) => {
      const u = m.user;
      const isSelf = callerUser && callerUser.id === m.userId;

      return {
        id: m.id,
        orgId: m.orgId,
        userId: m.userId,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt || m.createdAt,
        user: {
          id: u?.id,
          name: u?.name || 'Member',
          displayName: u?.displayName || u?.name || 'Member',
          designation: u?.designation || null,
          bio: u?.bio || null,
          image: u?.avatarVisible !== false ? u?.image : null,
          email: isAdmin || isSelf || u?.showEmailPublicly ? u?.email : null,
          phone: isAdmin || isSelf || u?.showPhonePublicly ? u?.phone : null,
        },
      };
    });

    return paginatedResponse(
      sanitizedMembers,
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
