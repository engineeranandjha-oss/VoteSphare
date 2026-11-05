import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { isMember } from '@/lib/auth/authorization';
import { successResponse } from '@/lib/utils/response';
import {
  handleApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/utils/error-handler';
import { Organization, AuditLog, User, Election, Member } from '@/models/index.js';

/**
 * Helper to resolve organization by ID or slug
 */
async function resolveOrganization(orgId) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
  return Organization.findOne({
    where: isUUID ? { id: orgId } : { slug: orgId.toLowerCase() },
  });
}

/**
 * Format relative time (e.g. "Just now", "10m ago", "2h ago", "Yesterday")
 */
function formatRelativeTime(date) {
  if (!date) return 'Recently';
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * GET /api/orgs/[orgId]/activity
 * Returns real audit log activities and events for an organization workspace.
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
      throw new UnauthorizedError('User synchronization failed');
    }

    const organization = await resolveOrganization(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Verify user is a member of the organization
    const hasMembership = await isMember(dbUser.id, organization.id);
    if (!hasMembership) {
      throw new ForbiddenError('You are not a member of this organization');
    }

    // 1. Fetch persistent AuditLog entries
    const auditLogs = await AuditLog.findAll({
      where: { orgId: organization.id },
      order: [['timestamp', 'DESC']],
      limit: 25,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    const activities = [];

    // Map existing AuditLogs
    for (const log of auditLogs) {
      const meta = log.metadata || {};
      const actorName = log.user?.name || log.user?.email || 'Administrator';
      let title = 'Workspace Action';
      let description = `Action ${log.action} performed by ${actorName}`;
      let iconType = 'activity';
      let color = 'text-blue-400 bg-blue-500/10 border-blue-500/20';

      switch (log.action) {
        case 'ELECTION_STATUS_CHANGE': {
          const prev = (meta.previousStatus || 'draft').toUpperCase();
          const next = (meta.newStatus || 'live').toUpperCase();
          title = `Election Status → ${next}`;
          description = `Election lifecycle transitioned from ${prev} to ${next} by ${actorName}.`;
          if (meta.newStatus === 'live') {
            iconType = 'play';
            color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          } else if (meta.newStatus === 'ended') {
            iconType = 'lock';
            color = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          } else if (meta.newStatus === 'published') {
            iconType = 'shield';
            color = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
          }
          break;
        }
        case 'RESULTS_PUBLISHED': {
          title = 'Results Certified & Published';
          description = `Official election results and winner outcomes were cryptographically sealed and published.`;
          iconType = 'shield';
          color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          break;
        }
        case 'RESULTS_UNPUBLISHED': {
          title = 'Results Unpublished';
          description = `Election results were unpublished for administrative review.`;
          iconType = 'lock';
          color = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          break;
        }
        case 'ELECTION_CREATED': {
          title = `Election Created: ${meta.title || 'New Ballot'}`;
          description = `New election ballot created in draft state by ${actorName}.`;
          iconType = 'vote';
          color = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
          break;
        }
        case 'MEMBER_INVITED': {
          title = 'Member Invitation Dispatched';
          description = `Invitation sent to ${meta.email || 'new member'} with role "${meta.role || 'voter'}".`;
          iconType = 'mail';
          color = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
          break;
        }
        default: {
          title = log.action.replace(/_/g, ' ');
          description = `Action recorded by ${actorName}.`;
        }
      }

      activities.push({
        id: log.id,
        action: log.action,
        title,
        description,
        timestamp: log.timestamp,
        timeAgo: formatRelativeTime(log.timestamp),
        iconType,
        color,
      });
    }

    // 2. Fetch real Election states to augment activities if few audit logs exist
    const elections = await Election.findAll({
      where: { orgId: organization.id },
      order: [['updatedAt', 'DESC']],
      limit: 10,
    });

    for (const elec of elections) {
      // If election is published
      if (elec.status === 'published') {
        const pubTime = elec.config?.publishingDetails?.publishedAt || elec.updatedAt;
        const exists = activities.some((a) => a.action === 'RESULTS_PUBLISHED' && Math.abs(new Date(a.timestamp) - new Date(pubTime)) < 5000);
        if (!exists) {
          activities.push({
            id: `elec-pub-${elec.id}`,
            action: 'RESULTS_PUBLISHED',
            title: `Results Certified: ${elec.title}`,
            description: `Official results certified and sealed.`,
            timestamp: pubTime,
            timeAgo: formatRelativeTime(pubTime),
            iconType: 'shield',
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          });
        }
      }

      // If election is live
      if (elec.status === 'live') {
        activities.push({
          id: `elec-live-${elec.id}`,
          action: 'ELECTION_LIVE',
          title: `Polls Active: ${elec.title}`,
          description: `Live voting is currently open for eligible electors.`,
          timestamp: elec.updatedAt,
          timeAgo: formatRelativeTime(elec.updatedAt),
          iconType: 'play',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        });
      }

      // Election created
      activities.push({
        id: `elec-create-${elec.id}`,
        action: 'ELECTION_CREATED',
        title: `Election Initialized: ${elec.title}`,
        description: `Ballot created (${elec.status} status).`,
        timestamp: elec.createdAt,
        timeAgo: formatRelativeTime(elec.createdAt),
        iconType: 'vote',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      });
    }

    // 3. Fetch real recent Members
    const members = await Member.findAll({
      where: { orgId: organization.id },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    for (const m of members) {
      const memberName = m.user?.name || m.user?.email || 'Member';
      if (m.status === 'active') {
        activities.push({
          id: `member-active-${m.id}`,
          action: 'MEMBER_JOINED',
          title: `Active Member: ${memberName}`,
          description: `Enrolled in workspace with role "${m.role}".`,
          timestamp: m.joinedAt || m.updatedAt || m.createdAt,
          timeAgo: formatRelativeTime(m.joinedAt || m.updatedAt || m.createdAt),
          iconType: 'users',
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        });
      } else if (m.status === 'pending') {
        activities.push({
          id: `member-pending-${m.id}`,
          action: 'MEMBER_INVITED',
          title: `Pending Invitation: ${memberName}`,
          description: `Invitation issued for role "${m.role}".`,
          timestamp: m.createdAt,
          timeAgo: formatRelativeTime(m.createdAt),
          iconType: 'mail',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        });
      }
    }

    // Deduplicate activities by id and sort chronologically (most recent first)
    const uniqueMap = new Map();
    for (const act of activities) {
      if (!uniqueMap.has(act.id)) {
        uniqueMap.set(act.id, act);
      }
    }

    const sortedActivities = Array.from(uniqueMap.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15);

    return successResponse(sortedActivities, 'Workspace activities retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
