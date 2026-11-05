/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo } from 'react';
import MemberRoleSelect from './member-role-select';
import {
  Search,
  Trash2,
  Calendar,
  Loader2,
  Users,
  Send,
  LayoutGrid,
  List,
  ArrowUpDown,
  Shield,
  ShieldCheck,
  User,
  Briefcase,
  Mail,
  Phone,
} from 'lucide-react';

/**
 * MemberList component rendering organization member directory with search, filters,
 * sorting, grid/list view modes, role management, and privacy-aware profiles.
 */
export default function MemberList({
  members = [],
  currentUserId,
  callerRole,
  onRoleChange,
  onRemoveMember,
  onResendInvite,
  loading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'name-desc', 'date-desc', 'date-asc', 'role'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [removingId, setRemovingId] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  const canManage = callerRole === 'owner' || callerRole === 'admin';

  // Filter and sort members
  const processedMembers = useMemo(() => {
    let result = members.filter((member) => {
      const user = member.user || {};
      const name = (user.name || '').toLowerCase();
      const displayName = (user.displayName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const designation = (user.designation || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        displayName.includes(q) ||
        email.includes(q) ||
        designation.includes(q);

      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Apply sorting
    result.sort((a, b) => {
      const nameA = (a.user?.displayName || a.user?.name || '').toLowerCase();
      const nameB = (b.user?.displayName || b.user?.name || '').toLowerCase();
      const dateA = new Date(a.joinedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.joinedAt || b.createdAt || 0).getTime();

      switch (sortBy) {
        case 'name-asc':
          return nameA.localeCompare(nameB);
        case 'name-desc':
          return nameB.localeCompare(nameA);
        case 'date-asc':
          return dateA - dateB;
        case 'date-desc':
          return dateB - dateA;
        case 'role': {
          const roleWeights = { owner: 1, admin: 2, voter: 3 };
          return (roleWeights[a.role] || 9) - (roleWeights[b.role] || 9);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [members, searchQuery, roleFilter, statusFilter, sortBy]);

  const handleResend = async (member) => {
    if (!onResendInvite || resendingId) return;
    try {
      setResendingId(member.id);
      await onResendInvite(member);
    } finally {
      setResendingId(null);
    }
  };

  const handleRemove = async (member) => {
    if (removingId) return;
    const userName = member.user?.displayName || member.user?.name || member.user?.email || 'this member';
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
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            Pending
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            {status}
          </span>
        );
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-300 border border-purple-500/30">
            <ShieldCheck className="h-3 w-3" /> Owner
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-300 border border-blue-500/30">
            <Shield className="h-3 w-3" /> Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700">
            <User className="h-3 w-3" /> Member
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
    return 'MB';
  };

  return (
    <div className="space-y-6">
      {/* Search, Filter, Sort, & View Toggle Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, display name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filter Badges & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owners</option>
            <option value="admin">Admins</option>
            <option value="voter">Members / Voters</option>
          </select>

          {/* Status Filter (Admin Only) */}
          {canManage && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          )}

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="name-desc">Sort: Name (Z-A)</option>
            <option value="date-desc">Sort: Newest Joined</option>
            <option value="date-asc">Sort: Oldest Joined</option>
            <option value="role">Sort: By Role</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Header Info / Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong>{processedMembers.length}</strong> of <strong>{members.length}</strong> members
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-blue-400 hover:underline"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400 rounded-3xl border border-slate-800 bg-slate-900/40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading organization directory...</p>
        </div>
      ) : processedMembers.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center text-slate-400 rounded-3xl border border-slate-800 bg-slate-900/40">
          <Users className="h-10 w-10 text-slate-600 mb-1" />
          <p className="text-base font-semibold text-slate-200">No members match your criteria</p>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search query, role filters, or status selection'
              : 'Invite authorized members to start assembling this organization directory'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedMembers.map((member) => {
            const user = member.user || {};
            const isOwnerMember = member.role === 'owner';
            const isSelf = member.userId === currentUserId;
            const isRemoving = removingId === member.id;

            return (
              <div
                key={member.id}
                className="rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900/80 to-slate-900/40 p-5 backdrop-blur-xl shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* User Avatar */}
                    <div className="relative">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.displayName || user.name || 'Member'}
                          className="h-14 w-14 rounded-2xl border border-slate-700 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/30 font-bold text-blue-300 text-lg">
                          {getInitials(user.displayName || user.name, user.email)}
                        </div>
                      )}
                      {isSelf && (
                        <span className="absolute -bottom-1 -right-1 rounded-md bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                          You
                        </span>
                      )}
                    </div>

                    {/* Role & Status */}
                    <div className="flex flex-col items-end gap-1.5">
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.status)}
                    </div>
                  </div>

                  {/* Name & Designation */}
                  <div>
                    <h4 className="font-bold text-white text-base truncate">
                      {user.displayName || user.name || 'Member'}
                    </h4>
                    {user.designation ? (
                      <p className="text-xs text-blue-400 font-medium flex items-center gap-1 mt-0.5">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        <span className="truncate">{user.designation}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">Organization Member</p>
                    )}
                  </div>

                  {/* Bio Snippet */}
                  {user.bio && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {user.bio}
                    </p>
                  )}

                  {/* Contact Info (if approved) */}
                  {(user.email || user.phone) && (
                    <div className="space-y-1 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                      {user.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Joined Date & Action */}
                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Active'}
                    </span>
                  </div>

                  {/* Actions for Admin */}
                  {canManage && !isOwnerMember && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRemove(member)}
                        disabled={isRemoving}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove Member"
                      >
                        {isRemoving ? <Loader2 className="h-4 w-4 animate-spin text-rose-500" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 shadow-xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Member Name & Identity
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
              <tbody className="divide-y divide-slate-800/60">
                {processedMembers.map((member) => {
                  const user = member.user || {};
                  const isOwnerMember = member.role === 'owner';
                  const isSelf = member.userId === currentUserId;
                  const isRemoving = removingId === member.id;

                  return (
                    <tr key={member.id} className="transition-colors hover:bg-slate-800/30">
                      {/* Avatar + Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.displayName || user.name || 'Member avatar'}
                              className="h-10 w-10 rounded-2xl border border-slate-700 object-cover shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30 font-bold text-blue-300 text-xs">
                              {getInitials(user.displayName || user.name, user.email)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate">
                                {user.displayName || user.name || 'Member'}
                              </span>
                              {isSelf && (
                                <span className="rounded-md bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                              {user.designation && (
                                <span className="text-blue-400 font-medium truncate">
                                  {user.designation} •
                                </span>
                              )}
                              {user.email ? (
                                <span className="truncate">{user.email}</span>
                              ) : (
                                <span className="text-slate-500 italic">Private Contact</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Dropdown / Badge */}
                      <td className="px-6 py-4">
                        {canManage && !isOwnerMember ? (
                          <MemberRoleSelect
                            memberId={member.id}
                            currentRole={member.role}
                            canManage={canManage}
                            isOwner={isOwnerMember}
                            onRoleChange={onRoleChange}
                          />
                        ) : (
                          getRoleBadge(member.role)
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">{getStatusBadge(member.status)}</td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            {member.joinedAt
                              ? new Date(member.joinedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Active'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {member.status === 'pending' && canManage && onResendInvite && (
                            <button
                              onClick={() => handleResend(member)}
                              disabled={isRemoving || resendingId === member.id}
                              aria-busy={resendingId === member.id}
                              title="Resend Invitation Email"
                              className="inline-flex items-center justify-center rounded-lg p-2 text-blue-400 transition-colors hover:bg-blue-500/10 focus:outline-none disabled:opacity-50"
                            >
                              {resendingId === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {isOwnerMember ? (
                            <span className="text-xs text-slate-600 italic">Owner</span>
                          ) : canManage || isSelf ? (
                            <button
                              onClick={() => handleRemove(member)}
                              disabled={isRemoving || resendingId === member.id}
                              aria-busy={isRemoving}
                              title={isSelf ? 'Leave Organization' : 'Remove Member'}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 focus:outline-none disabled:opacity-50"
                            >
                              {isRemoving ? (
                                <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
