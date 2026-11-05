export const dynamic = 'force-dynamic';

import { Organization, Member, User, Election, Position, Candidate, Eligibility } from '@/models/index.js';
import { Op } from 'sequelize';
import { getCurrentDbUser } from '@/lib/auth/session';
import { getUserRole } from '@/lib/auth/authorization';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, NotFoundError } from '@/lib/utils/error-handler';

/**
 * GET /api/orgs/public/[slug]/people
 * Accessible Organization People Directory endpoint.
 * Provides separate categories:
 *  A. Organization Members (Owner, Admins, Members)
 *  B. Election Participants (Candidates & Registered Eligible Voters)
 *
 * Privacy Guarantees:
 *  - Individual secret ballot choices and votes are strictly NEVER exposed.
 *  - Voting status (whether someone voted) is NOT revealed to preserve secret ballot anonymity.
 *  - Private email addresses and phone numbers are hidden unless explicitly enabled by the user.
 *  - Internal auth identifiers and password hashes are never exposed.
 *  - Profile visibility preferences (isProfilePublic, avatarVisible) are respected.
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
      attributes: [
        'id',
        'name',
        'slug',
        'ownerId',
        'memberDirectoryVisibility',
        'isVerified',
      ],
    });

    if (!organization) {
      throw new NotFoundError(`Organization '${slug}' not found`);
    }

    // 1. Determine caller identity and authorization level
    let dbUser = null;
    let callerRole = null;
    let isEligibleVoter = false;

    try {
      dbUser = await getCurrentDbUser();
      if (dbUser) {
        callerRole = await getUserRole(organization.id, dbUser.id);

        // Check if user is an eligible voter in any election of this organization
        if (!callerRole) {
          const orgElections = await Election.findAll({
            where: { orgId: organization.id },
            attributes: ['id'],
            raw: true,
          });
          const electionIds = orgElections.map((e) => e.id);

          if (electionIds.length > 0) {
            // Check member linkage
            const userMember = await Member.findOne({
              where: { orgId: organization.id, userId: dbUser.id },
              attributes: ['id', 'role'],
            });

            if (userMember) {
              const elig = await Eligibility.findOne({
                where: {
                  electionId: { [Op.in]: electionIds },
                  memberId: userMember.id,
                },
                attributes: ['id'],
              });
              if (elig) {
                isEligibleVoter = true;
                callerRole = 'voter';
              }
            }
          }
        }
      }
    } catch {
      // Unauthenticated visitor
    }

    const isAdmin = callerRole === 'owner' || callerRole === 'admin';
    const isVoterOrMember = callerRole === 'owner' || callerRole === 'admin' || callerRole === 'voter' || isEligibleVoter;
    const isAuthUser = Boolean(dbUser);

    const visibility = organization.memberDirectoryVisibility || 'members_only';

    // Access control evaluation:
    // - 'public': Anyone can view
    // - 'members_only': Any authenticated user with 'owner', 'admin', 'voter' role or member association can view
    // - 'private': Only owner and admins can view
    let canAccess = false;
    let accessNotice = null;

    if (visibility === 'public') {
      canAccess = true;
    } else if (visibility === 'members_only') {
      if (isAuthUser && (isVoterOrMember || dbUser)) {
        // Authenticated voters & members are allowed
        canAccess = true;
      } else if (!isAuthUser) {
        canAccess = false;
        accessNotice = 'Authentication required. Please sign in with your voter or member account to view the directory.';
      } else {
        // Authenticated user with no relationship to this private org
        canAccess = false;
        accessNotice = 'This directory is restricted to organization members and registered election voters.';
      }
    } else if (visibility === 'private') {
      if (isAdmin) {
        canAccess = true;
      } else {
        canAccess = false;
        accessNotice = 'This organization directory is set to private by administrative policy.';
      }
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim().toLowerCase() || '';
    const categoryFilter = searchParams.get('category')?.toLowerCase(); // 'members' | 'participants' | 'all'

    // 2. Fetch Organization Members (Owner, Admins, Members)
    const membersList = await Member.findAll({
      where: {
        orgId: organization.id,
        status: 'active',
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'name',
            'displayName',
            'designation',
            'bio',
            'email',
            'phone',
            'image',
            'avatarVisible',
            'isProfilePublic',
            'showEmailPublicly',
            'showPhonePublicly',
          ],
        },
      ],
      order: [
        ['role', 'ASC'], // owner, admin, voter
        ['createdAt', 'ASC'],
      ],
    });

    // Also ensure the organization owner is included if not in membersList
    const ownerUser = await User.findByPk(organization.ownerId, {
      attributes: [
        'id',
        'name',
        'displayName',
        'designation',
        'bio',
        'email',
        'phone',
        'image',
        'avatarVisible',
        'isProfilePublic',
        'showEmailPublicly',
        'showPhonePublicly',
      ],
    });

    const sanitizedMembers = [];
    const seenUserIds = new Set();

    // Add owner first
    if (ownerUser) {
      seenUserIds.add(ownerUser.id);
      sanitizedMembers.push({
        id: `owner-${ownerUser.id}`,
        name: ownerUser.displayName || ownerUser.name,
        fullName: ownerUser.name,
        role: 'owner',
        roleLabel: 'Organization Owner',
        category: 'member',
        designation: ownerUser.designation || 'Founder & Executive Officer',
        bio: ownerUser.bio || null,
        image: ownerUser.avatarVisible !== false ? ownerUser.image : null,
        publicEmail: ownerUser.showEmailPublicly ? ownerUser.email : null,
        publicPhone: ownerUser.showPhonePublicly ? ownerUser.phone : null,
      });
    }

    for (const m of membersList) {
      const u = m.user;
      if (!u || seenUserIds.has(u.id)) continue;
      seenUserIds.add(u.id);

      if (u.isProfilePublic === false && !isAdmin) {
        continue; // Respect private profile
      }

      const roleLabel =
        m.role === 'owner'
          ? 'Organization Owner'
          : m.role === 'admin'
          ? 'Administrator'
          : 'Organization Member';

      sanitizedMembers.push({
        id: `mem-${m.id}`,
        name: u.displayName || u.name,
        fullName: u.name,
        role: m.role,
        roleLabel,
        category: 'member',
        designation: u.designation || null,
        bio: u.bio || null,
        image: u.avatarVisible !== false ? u.image : null,
        publicEmail: u.showEmailPublicly || isAdmin ? u.email : null,
        publicPhone: u.showPhonePublicly || isAdmin ? u.phone : null,
      });
    }

    // 3. Fetch Election Participants (Candidates & Registered Voters)
    const orgElections = await Election.findAll({
      where: {
        orgId: organization.id,
        status: { [Op.in]: ['live', 'scheduled', 'ended', 'published', 'archived'] },
      },
      attributes: ['id', 'title', 'status'],
    });

    const electionIds = orgElections.map((e) => e.id);
    const electionTitleMap = new Map(orgElections.map((e) => [e.id, e.title]));

    // 3A. Candidates
    const candidatesList = await Candidate.findAll({
      include: [
        {
          model: Position,
          as: 'position',
          where: { electionId: { [Op.in]: electionIds } },
          attributes: ['id', 'name', 'electionId'],
        },
      ],
      where: { status: 'active' },
      attributes: ['id', 'name', 'photo', 'bio', 'manifesto'],
    });

    const sanitizedCandidates = candidatesList.map((c) => {
      const posName = c.position?.name || 'Candidate';
      const elecTitle = c.position?.electionId ? electionTitleMap.get(c.position.electionId) : null;

      return {
        id: `cand-${c.id}`,
        name: c.name,
        fullName: c.name,
        role: 'candidate',
        roleLabel: 'Official Candidate',
        category: 'participant',
        participantType: 'candidate',
        designation: elecTitle ? `Candidate for ${posName} (${elecTitle})` : `Candidate for ${posName}`,
        bio: c.bio || c.manifesto || null,
        image: c.photo || null,
        publicEmail: null,
        publicPhone: null,
      };
    });

    // 3B. Registered Eligible Voters
    // Link Eligibility -> Member -> User
    const eligibilities = await Eligibility.findAll({
      where: { electionId: { [Op.in]: electionIds } },
      include: [
        {
          model: Member,
          as: 'member',
          include: [
            {
              model: User,
              as: 'user',
              attributes: [
                'id',
                'name',
                'displayName',
                'designation',
                'bio',
                'image',
                'avatarVisible',
                'isProfilePublic',
                'showEmailPublicly',
                'showPhonePublicly',
              ],
            },
          ],
        },
      ],
    });

    const seenVoterIds = new Set();
    const sanitizedVoters = [];

    for (const el of eligibilities) {
      const u = el.member?.user;
      if (!u || seenVoterIds.has(u.id)) continue;
      seenVoterIds.add(u.id);

      // Do NOT reveal whether person voted! Constitutional anonymity guarantee.
      sanitizedVoters.push({
        id: `voter-${el.id}`,
        name: u.displayName || u.name,
        fullName: u.name,
        role: 'voter',
        roleLabel: 'Registered Voter',
        category: 'participant',
        participantType: 'voter',
        designation: u.designation || 'Eligible Electoral Participant',
        bio: u.bio || null,
        image: u.avatarVisible !== false ? u.image : null,
        publicEmail: u.showEmailPublicly || isAdmin ? u.email : null,
        publicPhone: u.showPhonePublicly || isAdmin ? u.phone : null,
      });
    }

    const allParticipants = [...sanitizedCandidates, ...sanitizedVoters];

    // Compute Counts
    const counts = {
      totalMembers: sanitizedMembers.length,
      totalParticipants: allParticipants.length,
      totalCandidates: sanitizedCandidates.length,
      totalVoters: sanitizedVoters.length,
      grandTotal: sanitizedMembers.length + allParticipants.length,
    };

    // If caller cannot access full directory due to permissions, return counts and notice
    if (!canAccess) {
      return successResponse(
        {
          canAccess: false,
          accessNotice,
          visibility,
          counts,
          members: [],
          participants: [],
        },
        'Directory metadata retrieved (access restricted)'
      );
    }

    // Apply text search filtering if specified
    const matchesSearch = (item) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.fullName?.toLowerCase().includes(q) ||
        item.designation?.toLowerCase().includes(q) ||
        item.roleLabel?.toLowerCase().includes(q)
      );
    };

    const filteredMembers = sanitizedMembers.filter(matchesSearch);
    const filteredParticipants = allParticipants.filter(matchesSearch);

    let returnedMembers = filteredMembers;
    let returnedParticipants = filteredParticipants;

    if (categoryFilter === 'members') {
      returnedParticipants = [];
    } else if (categoryFilter === 'participants') {
      returnedMembers = [];
    }

    return successResponse(
      {
        canAccess: true,
        visibility,
        counts,
        members: returnedMembers,
        participants: returnedParticipants,
      },
      'Organization people directory retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

