'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import MemberList from '@/components/orgs/member-list';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Building2,
  AlertCircle,
  Loader2,
  X,
  Mail,
  Shield,
  User,
} from 'lucide-react';

export default function OrgMembersPage() {
  const { orgId } = useParams();

  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('voter');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load Organization & Member Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Session
      const sessionRes = await fetch('/api/auth/session');
      const sessionJson = await sessionRes.json();
      if (sessionJson.success && sessionJson.data?.user) {
        setCurrentUser(sessionJson.data.dbUser || sessionJson.data.user);
      }

      // 2. Fetch Organization Details
      const orgRes = await fetch(`/api/orgs/${orgId}`);
      const orgJson = await orgRes.json();
      if (!orgRes.ok || !orgJson.success) {
        setError(orgJson.message || 'Failed to load organization');
        setLoading(false);
        return;
      }
      setOrg(orgJson.data);

      // 3. Fetch Organization Members
      const membersRes = await fetch(`/api/orgs/${orgId}/members?status=all&limit=100`);
      const membersJson = await membersRes.json();
      if (membersRes.ok && membersJson.success) {
        setMembers(membersJson.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load member directory');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) {
      fetchData();
    }
  }, [orgId, fetchData]);

  // Handle Role Change
  const handleRoleChange = async (memberId, newRole) => {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || 'Failed to update member role');
      throw new Error(json.message);
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  // Handle Remove Member
  const handleRemoveMember = async (memberId) => {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'DELETE',
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || 'Failed to remove member');
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (org) {
      setOrg((prev) => ({ ...prev, memberCount: Math.max(0, (prev.memberCount || 1) - 1) }));
    }
  };

  // Handle Send Invite
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setInviting(true);
      setInviteError(null);
      setInviteResult(null);

      const res = await fetch(`/api/orgs/${orgId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setInviteError(json.message || 'Failed to send invitation');
        setInviting(false);
        return;
      }

      setInviteResult(json.data);
      setInviteEmail('');
      fetchData(); // Refresh list to show pending member
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canManage = org?.userRole === 'owner' || org?.userRole === 'admin';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Organization Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {org?.name || 'Organization'}
              </h1>
              {org?.type && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  {org.type}
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>slug: @{org?.slug || orgId}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </p>
          </div>
        </div>

        {/* Invite Member CTA */}
        {canManage && (
          <button
            id="open-invite-modal-button"
            onClick={() => {
              setInviteModalOpen(true);
              setInviteResult(null);
              setInviteError(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Member Directory List */}
      <MemberList
        members={members}
        currentUserId={currentUser?.id}
        callerRole={org?.userRole}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
        loading={loading}
      />

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-xl">
            {/* Modal Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Invite New Member</h3>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error in modal */}
            {inviteError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {/* Success state with copyable link */}
            {inviteResult ? (
              <div className="space-y-4 py-2">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-500">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Check className="h-4 w-4" />
                    <span>Invitation Sent Successfully!</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    An email invitation was dispatched to <strong>{inviteResult.email}</strong>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Direct Invitation Link (Valid for 7 days)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteResult.inviteLink}
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(inviteResult.inviteLink)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setInviteResult(null);
                      setInviteModalOpen(false);
                    }}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Invitation Form */
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Recipient Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Organization Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                        inviteRole === 'voter'
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border/80 bg-background/60 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="voter"
                        checked={inviteRole === 'voter'}
                        onChange={() => setInviteRole('voter')}
                        className="sr-only"
                      />
                      <User className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-foreground">Voter</div>
                        <div className="text-[10px] text-muted-foreground">Cast ballots only</div>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                        inviteRole === 'admin'
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border/80 bg-background/60 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={inviteRole === 'admin'}
                        onChange={() => setInviteRole('admin')}
                        className="sr-only"
                      />
                      <Shield className="h-4 w-4 text-blue-400" />
                      <div>
                        <div className="font-semibold text-foreground">Admin</div>
                        <div className="text-[10px] text-muted-foreground">Manage elections & members</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending Invite...</span>
                      </>
                    ) : (
                      <span>Send Invitation</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
