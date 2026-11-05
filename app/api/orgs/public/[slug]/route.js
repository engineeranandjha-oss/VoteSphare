export const dynamic = 'force-dynamic';

import { Organization, User, Election, Vote, Eligibility } from '@/models/index.js';
import { Op } from 'sequelize';
import { getCurrentDbUser } from '@/lib/auth/session';
import { getUserRole } from '@/lib/auth/authorization';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, NotFoundError } from '@/lib/utils/error-handler';

/**
 * GET /api/orgs/public/[slug]
 * Public-safe organization transparency endpoint.
 * Returns organization metadata, public owner profile, and privacy-safe aggregated statistics.
 * No private email addresses, personal phone numbers, or internal auth IDs are exposed.
 */
export async function GET(request, { params }) {
  try {
    const { slug } = params;
    if (!slug) {
      throw new NotFoundError('Organization slug is required');
    }

    const cleanSlug = slug.trim().toLowerCase();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

    const organization = await Organization.findOne({
      where: isUUID ? { id: cleanSlug } : { slug: cleanSlug },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: [
            'id',
            'name',
            'displayName',
            'image',
            'designation',
            'bio',
            'email',
            'phone',
            'showEmailPublicly',
            'showPhonePublicly',
            'avatarVisible',
          ],
        },
      ],
    });

    if (!organization) {
      throw new NotFoundError(`Organization '${slug}' not found`);
    }

    // 1. Check if caller is authenticated and has administrative management role
    let canManage = false;
    let callerRole = null;
    try {
      const dbUser = await getCurrentDbUser();
      if (dbUser) {
        callerRole = await getUserRole(organization.id, dbUser.id);
        canManage = callerRole === 'owner' || callerRole === 'admin';
      }
    } catch {
      // Unauthenticated visitors proceed cleanly with canManage = false
    }

    // 2. Compute Aggregated Statistics (Strictly excluding drafts for public transparency)
    const electionCounts = await Election.findAll({
      where: {
        orgId: organization.id,
        status: { [Op.in]: ['live', 'scheduled', 'ended', 'published', 'archived'] },
      },
      attributes: ['id', 'status'],
      raw: true,
    });

    const activeElections = electionCounts.filter((e) => e.status === 'live').length;
    const upcomingElections = electionCounts.filter((e) => e.status === 'scheduled').length;
    const completedElections = electionCounts.filter(
      (e) => e.status === 'ended' || e.status === 'published' || e.status === 'archived'
    ).length;
    const publishedElections = electionCounts.filter((e) => e.status === 'published').length;
    const totalPublicElections = electionCounts.length;

    // Aggregated Participation Metrics (Privacy-Safe)
    const validElectionIds = electionCounts.map((e) => e.id);
    let totalVotesCast = 0;
    let totalEligibleParticipants = 0;

    if (validElectionIds.length > 0) {
      totalVotesCast = await Vote.count({
        where: { electionId: { [Op.in]: validElectionIds } },
      });

      totalEligibleParticipants = await Eligibility.count({
        where: { electionId: { [Op.in]: validElectionIds } },
      });
    }

    // 3. Serialize Public-Safe Owner Information
    const rawOwner = organization.owner;
    let sanitizedOwner = null;

    if (rawOwner) {
      sanitizedOwner = {
        name: rawOwner.displayName || rawOwner.name,
        designation: rawOwner.designation || 'Organization Founder / Owner',
        bio: rawOwner.bio || null,
        image: rawOwner.avatarVisible !== false ? rawOwner.image : null,
        publicEmail: rawOwner.showEmailPublicly ? rawOwner.email : null,
        publicPhone: rawOwner.showPhonePublicly ? rawOwner.phone : null,
      };
    }

    // 4. Construct Public Response Payload
    const publicData = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        type: organization.type || 'other',
        description: organization.description || null,
        logo: organization.logo || null,
        coverImage: organization.coverImage || null,
        website: organization.website || null,
        publicEmail: organization.publicEmail || null,
        publicPhone: organization.showPublicPhone ? organization.publicPhone : null,
        location: organization.location || null,
        establishedDate: organization.establishedDate || null,
        isVerified: Boolean(organization.isVerified),
        memberDirectoryVisibility: organization.memberDirectoryVisibility || 'members_only',
        createdAt: organization.createdAt,
      },
      owner: sanitizedOwner,
      statistics: {
        totalElections: totalPublicElections,
        activeElections,
        upcomingElections,
        completedElections,
        publishedElections,
        totalEligibleParticipants,
        totalVotesCast,
      },
      viewer: {
        canManage,
        callerRole,
      },
    };

    return successResponse(publicData, 'Public organization details retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

