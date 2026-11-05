'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Building2,
  Sparkles,
  Award,
  Shield,
  Key,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ProfileOverviewPage() {
  const { user, dbUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        const [profileRes, certsRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/user/certificates'),
        ]);

        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          setProfile(profileJson.data);
        }

        if (certsRes.ok) {
          const certsJson = await certsRes.json();
          setCertificatesCount(certsJson.data?.total || 0);
        }
      } catch (err) {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const handleCopyFingerprint = () => {
    if (profile?.cryptographicFingerprint) {
      navigator.clipboard.writeText(profile.cryptographicFingerprint);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2500);
    }
  };

  const userObj = profile?.user || dbUser || {};
  const memberships = profile?.memberships || [];
  const orgCount = profile?.userOrganizations?.length || memberships.length || 0;
  const currentSub = profile?.currentSubscription;

  const displayName = userObj.displayName || userObj.name || user?.userMetadata?.full_name || 'Member';
  const designation = userObj.designation || 'Voter & Organization Member';
  const email = userObj.email || user?.email || '';

  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading profile workspace overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800/80 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-lg shadow-blue-500/20 shrink-0 overflow-hidden">
              {userObj.image ? (
                <img src={userObj.image} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {displayName}
                </h1>
                {userObj.displayName && userObj.displayName !== userObj.name && (
                  <span className="text-xs text-slate-400 font-normal">({userObj.name})</span>
                )}
              </div>
              <p className="text-xs text-blue-400 font-semibold mt-0.5">{designation}</p>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                <span>{email}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since{' '}
                  {userObj.createdAt
                    ? new Date(userObj.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '2026'}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/profile/personal"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 self-start sm:self-center"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Organizations */}
        <Link
          href="/profile/organizations"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Organizations
            </span>
            <Building2 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{orgCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Workspaces joined or owned</span>
          </div>
        </Link>

        {/* Certificates */}
        <Link
          href="/profile/certificates"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Certificates
            </span>
            <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{certificatesCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Victory & civic awards</span>
          </div>
        </Link>

        {/* Active Plan */}
        <Link
          href="/profile/subscription"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Workspace Tier
            </span>
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg font-black text-white mt-2 truncate">
            {currentSub?.plan?.name || 'Community Free'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {currentSub?.organization?.name || 'Personal Workspace'}
          </div>
        </Link>

        {/* Security Fingerprint */}
        <Link
          href="/profile/security"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Voter Ledger
            </span>
            <Shield className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-sm font-mono font-bold text-emerald-400 mt-2 truncate">
            {profile?.cryptographicFingerprint?.slice(0, 12)}...
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Zero-Knowledge Authenticated</span>
          </div>
        </Link>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/profile/personal"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Personal Information & Bio</div>
              <p className="text-xs text-slate-400">Update display name, title, bio, and privacy flags</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/profile/organizations"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">My Organizations & Roles</div>
              <p className="text-xs text-slate-400">Manage joined workspaces and public portals</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/profile/certificates"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Certificates & Achievements</div>
              <p className="text-xs text-slate-400">View and download your official election awards</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/profile/security"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Account Security & Fingerprint</div>
              <p className="text-xs text-slate-400">Cryptographic voter identity and password security</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Cryptographic Voter Fingerprint Quick Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Cryptographic Voter Fingerprint</div>
            <div className="font-mono text-xs text-slate-400 break-all select-all">
              {profile?.cryptographicFingerprint || 'Generating...'}
            </div>
          </div>
        </div>

        <button
          onClick={handleCopyFingerprint}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center"
        >
          {copiedFingerprint ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Fingerprint</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
