import { Organization, Member, Election } from '@/models/index.js';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/lib/utils/error-handler';

/**
 * Retrieves the effective role of a user within a specific organization.
 * Returns 'owner', 'admin', 'voter', or null if the user has no active relationship.
 *
 * @param {string} orgId - Organization UUID
 * @param {string} userId - User UUID (MySQL user ID)
 * @returns {Promise<'owner' | 'admin' | 'voter' | null>}
 */
export async function getUserRole(orgId, userId) {
  if (!orgId || !userId) {
    return null;
  }

  try {
    // 1. Check if the user is the organization owner
    const organization = await Organization.findOne({
      where: { id: orgId, ownerId: userId },
      attributes: ['id', 'ownerId'],
    });

    if (organization) {
      return 'owner';
    }

    // 2. Check active membership in the organization
    const member = await Member.findOne({
      where: {
        orgId,
        userId,
        status: 'active',
      },
      attributes: ['id', 'role', 'status'],
    });

    if (member) {
      return member.role;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a user is the owner of an organization.
 *
 * @param {string} userId - User UUID
 * @param {string} orgId - Organization UUID
 * @returns {Promise<boolean>}
 */
export async function isOwner(userId, orgId) {
  if (!userId || !orgId) {
    return false;
  }

  const role = await getUserRole(orgId, userId);
  return role === 'owner';
}

/**
 * Checks if a user has administrative privileges (owner or admin) in an organization.
 *
 * @param {string} userId - User UUID
 * @param {string} orgId - Organization UUID
 * @returns {Promise<boolean>}
 */
export async function isAdmin(userId, orgId) {
  if (!userId || !orgId) {
    return false;
  }

  const role = await getUserRole(orgId, userId);
  return role === 'owner' || role === 'admin';
}

/**
 * Checks if a user is an active member or owner of an organization.
 *
 * @param {string} userId - User UUID
 * @param {string} orgId - Organization UUID
 * @returns {Promise<boolean>}
 */
export async function isMember(userId, orgId) {
  if (!userId || !orgId) {
    return false;
  }

  const role = await getUserRole(orgId, userId);
  return Boolean(role);
}

/**
 * Checks if a user has permission to manage an election.
 * Allowed if the user is the creator of the election or an admin/owner of the election's organization.
 *
 * @param {string} userId - User UUID
 * @param {string} electionId - Election UUID
 * @returns {Promise<boolean>}
 */
export async function canManageElection(userId, electionId) {
  if (!userId || !electionId) {
    return false;
  }

  try {
    const election = await Election.findByPk(electionId, {
      attributes: ['id', 'orgId', 'createdBy'],
    });

    if (!election) {
      return false;
    }

    if (election.createdBy === userId) {
      return true;
    }

    return await isAdmin(userId, election.orgId);
  } catch {
    return false;
  }
}

/**
 * Asserts that the user possesses one of the allowed roles in the given organization.
 * Throws ForbiddenError if unauthorized, or UnauthorizedError if user ID is missing.
 *
 * @param {string} userId - User UUID
 * @param {string} orgId - Organization UUID
 * @param {Array<'owner' | 'admin' | 'voter'>} allowedRoles - Array of permitted roles
 * @throws {UnauthorizedError | ForbiddenError}
 * @returns {Promise<'owner' | 'admin' | 'voter'>}
 */
export async function requireOrgRole(userId, orgId, allowedRoles = ['owner', 'admin']) {
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }

  const role = await getUserRole(orgId, userId);

  if (!role || !allowedRoles.includes(role)) {
    throw new ForbiddenError('You do not have permission to perform this action in this organization');
  }

  return role;
}

/**
 * Asserts that the user can manage the specified election.
 * Throws NotFoundError if the election does not exist, or ForbiddenError if unauthorized.
 *
 * @param {string} userId - User UUID
 * @param {string} electionId - Election UUID
 * @throws {UnauthorizedError | NotFoundError | ForbiddenError}
 * @returns {Promise<import('@/models/election.js').Election>}
 */
export async function requireElectionManageAccess(userId, electionId) {
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }

  const election = await Election.findByPk(electionId);

  if (!election) {
    throw new NotFoundError('Election not found');
  }

  const hasPermission =
    election.createdBy === userId || (await isAdmin(userId, election.orgId));

  if (!hasPermission) {
    throw new ForbiddenError('You do not have permission to manage this election');
  }

  return election;
}
