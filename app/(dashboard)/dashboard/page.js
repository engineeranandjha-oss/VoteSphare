'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  Vote,
  Shield,
  Loader2,
  Sparkles,
  ChevronRight,
  Radio,
  Users,
  Percent,
  Plus,
  ExternalLink,
  Settings,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import UserAvatarMenu from '@/components/auth/UserAvatarMenu';
import StatsCard from '@/components/dashboard/StatsCard';
import LiveElectionCard from '@/components/dashboard/LiveElectionCard';
import ElectionTable from '@/components/dashboard/ElectionTable';
import Logo from '@/components/common/Logo';

function DashboardRouter() {
  const router = useRouter();
  const { authenticated, loading: authLoading, user, dbUser } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [elections, setElections] = useState([]);
  const [loadingElections, setLoadingElections] = useState(false);
  const [error, setError] = useState(null);

  // 1. Initial Load of User's Organizations
  const loadUserOrgs = useCallback(async () => {
    try {
      setLoadingOrgs(true);
      setError(null);
      const res = await fetch('/api/orgs');
      if (res.ok) {
        const json = await res.json();
        const list = json.data?.organizations || json.data || [];
        setOrgs(list);

        if (list.length > 0) {
          // Select saved org from localStorage or default to first
          const savedOrgId = typeof window !== 'undefined' ? localStorage.getItem('votesphere_active_org') : null;
          const matchedOrg = list.find((o) => o.id === savedOrgId) || list[0];
          setSelectedOrgId(matchedOrg.id);
        }
      } else {
        setOrgs([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load organization workspaces');
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.replace('/auth/login?next=/dashboard');
      return;
    }

    if (authenticated) {
      loadUserOrgs();
    }
  }, [authenticated, authLoading, router, loadUserOrgs]);

  // 2. Load Selected Organization Data & Elections when selectedOrgId changes
  useEffect(() => {
    if (!selectedOrgId) {
      setOrgData(null);
      setElections([]);
      return;
    }

    async function fetchActiveOrgData() {
      try {
        setLoadingElections(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('votesphere_active_org', selectedOrgId);
        }

        const [orgRes, electionsRes] = await Promise.all([
          fetch(`/api/orgs/${selectedOrgId}`),
          fetch(`/api/orgs/${selectedOrgId}/elections?limit=50`),
        ]);

        const orgJson = await orgRes.json();
        const electionsJson = await electionsRes.json();

        if (orgRes.ok) {
          setOrgData(orgJson.data);
        }
        if (electionsRes.ok) {
          setElections(electionsJson.data?.elections || electionsJson.data || []);
        }
      } catch (err) {
        // Fallback gracefully
        setError(err.message || 'Failed to load workspace data');
      } finally {
        setLoadingElections(false);
      }
    }

    fetchActiveOrgData();
  }, [selectedOrgId]);

  if (authLoading || loadingOrgs) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 animate-pulse">
            <Vote className="h-8 w-8" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <p className="text-sm font-semibold text-slate-300">Loading your workspace central...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    dbUser?.name ||
    user?.userMetadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Member';

  const activeOrg = orgs.find((o) => o.id === selectedOrgId) || orgData || orgs[0];

  // Aggregate Metrics for Active Org
  const liveElections = elections.filter((e) => e.status === 'live');
  const totalElectionsCount = elections.length;

  let totalVotesSum = 0;
  let totalEligibleSum = 0;
  for (const e of elections) {
    totalVotesSum += e.stats?.totalVotes ?? e.stats?.totalVoted ?? 0;
    totalEligibleSum += e.stats?.eligibleVoterCount ?? e.stats?.totalEligible ?? 0;
  }

  const averageTurnout =
    totalEligibleSum > 0 ? Number(((totalVotesSum / totalEligibleSum) * 100).toFixed(1)) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={36} className="group-hover:scale-105 transition-transform" />
            <span className="text-xl font-black tracking-tight text-white">
              Vote<span className="text-blue-400">Sphere</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/voter"
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-all hover:border-emerald-500/30"
            >
              <Vote className="h-3.5 w-3.5 text-emerald-400" />
              <span>Voter Hub</span>
            </Link>
            <UserAvatarMenu />
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Smart Workspace Router</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-blue-400">{displayName}</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Manage your elections, switch between organization workspaces, or participate as an elector.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Organization</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-300">
            {error}
          </div>
        )}

        {/* State A: User belongs to 1 or more Organizations */}
        {orgs.length > 0 && activeOrg ? (
          <div className="space-y-8">
            {/* Organization Switcher Tabs */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-lg flex items-center justify-between gap-3 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">
                  Workspaces:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {orgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => setSelectedOrgId(org.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        org.id === activeOrg.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                          : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 opacity-80" />
                      <span className="truncate max-w-[140px]">{org.name}</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        ({org.userRole || 'Member'})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Link
                href={`/org/${activeOrg.id}/dashboard`}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-all"
              >
                <span>Full Org Hub</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Active Organization Header Spotlight */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
                    {activeOrg.logo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={activeOrg.logo}
                        alt={activeOrg.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <Building2 className="h-7 w-7" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        {activeOrg.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                        {activeOrg.type || 'Organization'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                        Role: {activeOrg.userRole || 'Active Member'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <Link
                        href={`/org/${activeOrg.slug || activeOrg.id}`}
                        target="_blank"
                        className="hover:text-blue-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
                      >
                        <span>/org/{activeOrg.slug || activeOrg.id}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      {activeOrg.description && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="line-clamp-1">{activeOrg.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {(() => {
                  const canManage = activeOrg.userRole === 'owner' || activeOrg.userRole === 'admin';
                  if (canManage) {
                    return (
                      <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto shrink-0">
                        <Link
                          href={`/org/${activeOrg.id}/elections/new`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>New Election</span>
                        </Link>

                        <Link
                          href={`/org/${activeOrg.id}/members`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all border border-slate-700"
                        >
                          <Users className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Members</span>
                        </Link>

                        <Link
                          href={`/org/${activeOrg.id}/settings`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all border border-slate-700"
                        >
                          <Settings className="h-3.5 w-3.5 text-purple-400" />
                          <span>Settings</span>
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto shrink-0">
                      <Link
                        href={`/org/${activeOrg.id}/elections`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20"
                      >
                        <Vote className="h-3.5 w-3.5" />
                        <span>Browse Ballots</span>
                      </Link>

                      <Link
                        href={`/org/${activeOrg.slug || activeOrg.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all border border-slate-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                        <span>Public Portal</span>
                      </Link>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Metrics Overview Grid */}
            {loadingElections ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                <div className="h-28 bg-slate-900 rounded-3xl" />
                <div className="h-28 bg-slate-900 rounded-3xl" />
                <div className="h-28 bg-slate-900 rounded-3xl" />
                <div className="h-28 bg-slate-900 rounded-3xl" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Live Voting"
                  value={liveElections.length}
                  subtitle={`${totalElectionsCount} Total Elections`}
                  icon={Radio}
                  color="blue"
                />
                <StatsCard
                  title="Registered Electors"
                  value={totalEligibleSum.toLocaleString()}
                  subtitle="Across All Rosters"
                  icon={Users}
                  color="indigo"
                />
                <StatsCard
                  title="Total Ballots Cast"
                  value={totalVotesSum.toLocaleString()}
                  subtitle="Verified Votes"
                  icon={Vote}
                  color="emerald"
                />
                <StatsCard
                  title="Average Turnout"
                  value={`${averageTurnout}%`}
                  subtitle="Platform Participation"
                  icon={Percent}
                  color="purple"
                />
              </div>
            )}

            {/* Live Election Spotlight */}
            {liveElections.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    Active Election Spotlight
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {liveElections.length} Live
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {liveElections.map((elec) => (
                    <LiveElectionCard
                      key={elec.id}
                      election={elec}
                      orgId={activeOrg.id}
                      canManage={activeOrg.userRole === 'owner' || activeOrg.userRole === 'admin'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Elections Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Vote className="h-5 w-5 text-blue-400" />
                  <span>Recent Elections ({elections.length})</span>
                </h3>

                <Link
                  href={`/org/${activeOrg.id}/dashboard`}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Open Full Workspace</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <ElectionTable
                elections={elections}
                orgId={activeOrg.id}
                canManage={activeOrg.userRole === 'owner' || activeOrg.userRole === 'admin'}
              />
            </div>
          </div>
        ) : (
          /* State B: User has NO Organizations Yet (Onboarding Experience) */
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center space-y-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner">
              <Building2 className="h-10 w-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl font-black text-white">
                Set Up Your Organization Workspace
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                You are currently not enrolled in any organization workspaces. Create your first
                organization to launch elections, or enter a join code from your admin.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Organization Workspace</span>
              </Link>

              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-sm font-bold text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
              >
                <KeyRound className="h-4 w-4 text-purple-400" />
                <span>Join with Code</span>
              </Link>

              <Link
                href="/voter"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-sm font-bold text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
              >
                <Vote className="h-4 w-4 text-emerald-400" />
                <span>Go to Voter Hub</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-6 border-t border-slate-800/80">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-bold text-white">Full Civic Governance</h4>
                <p className="text-[11px] text-slate-400">Configure elections, positions, and platform manifestos.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <Shield className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">Encrypted Blind Balloting</h4>
                <p className="text-[11px] text-slate-400">Anonymized token voting with tamper-evident audit logs.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <Users className="h-4 w-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white">Multi-tenant Roles</h4>
                <p className="text-[11px] text-slate-400">Invite co-organizers, election staff, and electors with granular permissions.</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Navigation Hub Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
          <Link
            href="/voter"
            className="group flex items-start gap-4 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-emerald-500/40 hover:bg-slate-900/90"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <Vote className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Voter Ballot Hub
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Browse elections you are registered for, cast anonymous ballots, and inspect cryptographic voting receipts.
              </p>
            </div>
          </Link>

          <Link
            href="/profile"
            className="group flex items-start gap-4 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-purple-500/40 hover:bg-slate-900/90"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                Account & Security
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Manage your cryptographic identity, session keys, multi-tenant roles, and notification preferences.
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardRouter />
    </Suspense>
  );
}
