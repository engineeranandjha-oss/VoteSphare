/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import MemberRoleSelect from './member-role-select';
import {
  Search,
  Trash2,
  Calendar,
  Loader2,
  Users,
} from 'lucide-react';

/**
 * MemberList component rendering organization members table with search, filters, and actions.
 */
export default function MemberList({
  members = [],
  currentUserId,
  callerRole,
  onRoleChange,
  onRemoveMember,
  loading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [removingId, setRemovingId] = useState(null);

  const canManage = callerRole === 'owner' || callerRole === 'admin';

  // Filter members based on search and selected chips
  const filteredMembers = members.filter((member) => {
    const user = member.user || {};
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || name.includes(q) || email.includes(q);
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRemove = async (member) => {
    const userName = member.user?.name || member.user?.email || 'this member';
    const isSelf = member.userId === currentUserId;

    const confirmMsg = isSelf
      ? 'Are you sure you want to leave this organization?'
      : `Are you sure you want to remove ${userName} from the organization?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setRemovingId(member.id);
      await onRemoveMember(member.id);
    } finally {
      setRemovingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
            Pending
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'VS';
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-background/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-border/80 bg-background/60 px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="voter">Voter</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border/80 bg-background/60 px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-md">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading organization members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <Users className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-base font-semibold text-foreground">No members found</p>
            <p className="text-xs">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search query or filters'
                : 'Invite your first member to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Member
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Joined Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredMembers.map((member) => {
                  const user = member.user || {};
                  const isOwnerMember = member.role === 'owner';
                  const isSelf = member.userId === currentUserId;
                  const isRemoving = removingId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      {/* User Avatar + Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || 'User avatar'}
                              className="h-10 w-10 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                              {getInitials(user.name, user.email)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground truncate">
                                {user.name || 'Pending User'}
                              </span>
                              {isSelf && (
                                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Dropdown / Badge */}
                      <td className="px-6 py-4">
                        <MemberRoleSelect
                          memberId={member.id}
                          currentRole={member.role}
                          canManage={canManage}
                          isOwner={isOwnerMember}
                          onRoleChange={onRoleChange}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">{getStatusBadge(member.status)}</td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {member.joinedAt
                              ? new Date(member.joinedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {isOwnerMember ? (
                          <span className="text-xs text-muted-foreground/60 italic">Owner</span>
                        ) : (canManage || isSelf) ? (
                          <button
                            onClick={() => handleRemove(member)}
                            disabled={isRemoving}
                            title={isSelf ? 'Leave Organization' : 'Remove Member'}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none disabled:opacity-50"
                          >
                            {isRemoving ? (
                              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
