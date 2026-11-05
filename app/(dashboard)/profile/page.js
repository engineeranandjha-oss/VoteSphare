'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Vote,
  User,
  Shield,
  Building2,
  Key,
  Copy,
  Check,
  Save,
  Loader2,
  Calendar,
  Sparkles,
  ArrowLeft,
  Lock,
  ChevronRight,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import UserAvatarMenu from '@/components/auth/UserAvatarMenu';
import ImageUpload from '@/components/common/ImageUpload';
import CurrentPlanCard from '@/components/profile/CurrentPlanCard';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';

function ProfileContent() {
  const router = useRouter();
  const { authenticated, loading: authLoading, user, dbUser, refresh: refreshAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [userImage, setUserImage] = useState('');
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [error, setError] = useState(null);

  // Preference switches (state only for UX demonstration)
  const [notifications, setNotifications] = useState({
    emailInvites: true,
    turnoutUpdates: false,
    resultsPublished: true,
  });

  const fetchProfile = useCallback(async (orgId = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = orgId ? `/api/user/profile?orgId=${encodeURIComponent(orgId)}` : '/api/user/profile';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data);
        setName(json.data?.user?.name || '');
        setUserImage(json.data?.user?.image || '');
        if (!orgId && json.data?.currentSubscription?.organization?.id) {
          setSelectedOrgId(json.data.currentSubscription.organization.id);
        }
      } else {
        throw new Error('Failed to load profile details');
      }
    } catch (err) {
      setError(err.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectOrg = (newOrgId) => {
    setSelectedOrgId(newOrgId);
    fetchProfile(newOrgId);
  };

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.replace('/auth/login?next=/profile');
      return;
    }

    if (authenticated) {
      fetchProfile();
    }
  }, [authenticated, authLoading, router, fetchProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSavingProfile(true);
      startGlobalProgress();
      setSaveSuccess(false);
      setError(null);

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          image: userImage || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update profile');
      }

      setSaveSuccess(true);
      await refreshAuth();
      fetchProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error saving profile');
    } finally {
      setSavingProfile(false);
      completeGlobalProgress();
    }
  };

  const handleCopyFingerprint = () => {
    if (profile?.cryptographicFingerprint) {
      navigator.clipboard.writeText(profile.cryptographicFingerprint);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2500);
    }
  };

  const userObj = profile?.user || dbUser || {};
  const memberships = profile?.memberships || [];
  const fingerprint = profile?.cryptographicFingerprint || 'Generating...';

  const displayName = userObj.name || dbUser?.name || user?.userMetadata?.full_name || 'User';

  const initials = displayName
    ? displayName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const displayImage =
    userImage ||
    userObj.image ||
    profile?.user?.image ||
    dbUser?.image ||
    user?.image ||
    user?.userMetadata?.avatar_url ||
    user?.userMetadata?.picture ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  useEffect(() => {
    setAvatarLoadError(false);
  }, [displayImage]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-sm font-semibold text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  const formattedDate = userObj.createdAt
    ? new Date(userObj.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/voter"
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Vote className="h-4 w-4 text-emerald-400" />
              <span>Voter Hub</span>
            </Link>
            <UserAvatarMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Profile Header Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-2xl font-black text-white shadow-xl shadow-blue-500/20 border border-blue-400/30 overflow-hidden shrink-0">
                {displayImage && !avatarLoadError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={displayImage}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarLoadError(true)}
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white">{displayName}</h1>
                  <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                    <Shield className="h-3 w-3" />
                    Verified Identity
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">{userObj.email || user?.email}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Member since {formattedDate}
                  </span>
                  <span>•</span>
                  <span>{memberships.length} Workspace{memberships.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Settings & Cryptographic ID */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workspace Plan & Commercial Subscription */}
            <CurrentPlanCard
              currentSubscription={profile?.currentSubscription}
              userOrganizations={profile?.userOrganizations || []}
              selectedOrgId={selectedOrgId}
              onSelectOrg={handleSelectOrg}
            />

            {/* Personal Details Form */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4">
                <User className="h-5 w-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Personal Information</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <ImageUpload
                  label="Profile Avatar / Photo"
                  value={userImage}
                  onChange={(val) => setUserImage(val || '')}
                  aspectRatio="avatar"
                  helperText="Upload profile photo (PNG, JPG, WEBP)"
                />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Primary Email Address
                  </label>
                  <input
                    type="email"
                    value={userObj.email || ''}
                    disabled
                    className="w-full rounded-2xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Your email is securely verified via Supabase Auth.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {saveSuccess ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4" />
                      Changes saved successfully!
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    disabled={savingProfile || (name === userObj.name && userImage === (userObj.image || ''))}
                    aria-busy={savingProfile ? 'true' : undefined}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Cryptographic Identity & Zero-Knowledge Security */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4">
                <Key className="h-5 w-5 text-indigo-400" />
                <div>
                  <h2 className="text-base font-bold text-white">Cryptographic Blind Fingerprint</h2>
                  <p className="text-xs text-slate-400">
                    Deterministic SHA-256 identifier used to sign and audit your anonymous ballot receipts.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-blue-400 break-all select-all">
                    {fingerprint}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyFingerprint}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    {copiedFingerprint ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
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

              <div className="flex items-start gap-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 p-4 text-xs text-slate-300">
                <Lock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Zero-Knowledge Isolation:</strong> Your ballot selections are never linked to your personal profile, email, or name in the database.
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4">
                <Bell className="h-5 w-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Notification Preferences</h2>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-950/40 cursor-pointer hover:bg-slate-950/70 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-white">Ballot Invitations</div>
                    <div className="text-[11px] text-slate-400">Receive email alerts when you are enrolled in an election</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.ballotInvites}
                    onChange={(e) => setNotifications({ ...notifications, ballotInvites: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-950/40 cursor-pointer hover:bg-slate-950/70 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-white">Certified Results Announcements</div>
                    <div className="text-[11px] text-slate-400">Receive certified results links when election polls close</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.resultsPublished}
                    onChange={(e) => setNotifications({ ...notifications, resultsPublished: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Organization Memberships */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Your Organizations</h2>
                </div>
                <Link
                  href="/onboarding"
                  className="text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  + New Org
                </Link>
              </div>

              {memberships.length > 0 ? (
                <div className="space-y-3">
                  {memberships.map((m) => (
                    <div
                      key={m.id}
                      className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-950"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {m.organization?.name || 'Organization'}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            /org/{m.organization?.slug}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300 border border-slate-700">
                          {m.role}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Active'}
                        </span>
                        {m.organization && (
                          <Link
                            href={`/org/${m.organization.id}/dashboard`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
                          >
                            <span>Launch</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center">
                  <p className="text-xs text-slate-400 mb-3">No organization memberships yet.</p>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Create an Organization</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
