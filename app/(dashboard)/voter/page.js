'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VoterStatsOverview from '@/components/voter/VoterStatsOverview';
import VoterElectionCard from '@/components/voter/VoterElectionCard';
import ReceiptHistoryCard from '@/components/voter/ReceiptHistoryCard';
import Logo from '@/components/common/Logo';
import {
  Vote,
  Radio,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Search,
  KeyRound,
  ArrowRight,
  Building2,
  Filter,
  CheckCircle,
  Archive,
} from 'lucide-react';

export default function VoterDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'voted' | 'upcoming' | 'concluded'
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');

  const loadVoterData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      setError(null);

      const res = await fetch('/api/user/elections', { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to load voter elections');
      }

      setData(json.data);
    } catch (err) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVoterData();
  }, [loadVoterData]);

  const handleAccessCodeSubmit = (e) => {
    e.preventDefault();
    const code = accessCode.trim();
    if (!code) {
      setAccessCodeError('Please enter a ballot code or invite URL');
      return;
    }
    setAccessCodeError('');

    // If it's a full URL or path
    if (code.includes('/join/')) {
      const parts = code.split('/join/');
      router.push(`/join/${parts[1]}`);
    } else if (code.includes('/e/')) {
      const parts = code.split('/e/');
      router.push(`/e/${parts[1]}`);
    } else {
      router.push(`/join/${code}`);
    }
  };

  const rawActiveToVote = data?.activeToVote;
  const rawVoted = data?.voted;
  const rawUpcoming = data?.upcoming;
  const rawConcluded = data?.concluded;
  const organizations = data?.organizations || [];

  // Filter items by search query
  const queryLower = searchQuery.trim().toLowerCase();

  const activeToVote = useMemo(() => {
    const list = rawActiveToVote || [];
    if (!queryLower) return list;
    return list.filter(
      (item) =>
        item.title?.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower) ||
        item.organization?.name?.toLowerCase().includes(queryLower) ||
        item.organization?.slug?.toLowerCase().includes(queryLower)
    );
  }, [rawActiveToVote, queryLower]);

  const voted = useMemo(() => {
    const list = rawVoted || [];
    if (!queryLower) return list;
    return list.filter(
      (item) =>
        item.title?.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower) ||
        item.organization?.name?.toLowerCase().includes(queryLower) ||
        item.organization?.slug?.toLowerCase().includes(queryLower)
    );
  }, [rawVoted, queryLower]);

  const upcoming = useMemo(() => {
    const list = rawUpcoming || [];
    if (!queryLower) return list;
    return list.filter(
      (item) =>
        item.title?.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower) ||
        item.organization?.name?.toLowerCase().includes(queryLower) ||
        item.organization?.slug?.toLowerCase().includes(queryLower)
    );
  }, [rawUpcoming, queryLower]);

  const concluded = useMemo(() => {
    const list = rawConcluded || [];
    if (!queryLower) return list;
    return list.filter(
      (item) =>
        item.title?.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower) ||
        item.organization?.name?.toLowerCase().includes(queryLower) ||
        item.organization?.slug?.toLowerCase().includes(queryLower)
    );
  }, [rawConcluded, queryLower]);

  const totalFiltered =
    activeToVote.length + voted.length + upcoming.length + concluded.length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="h-14 bg-slate-900 rounded-2xl w-full animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="h-28 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="h-28 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="h-28 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="h-28 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="h-28 bg-slate-900 rounded-3xl animate-pulse" />
          </div>
          <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to Load Dashboard</h2>
          <p className="text-xs text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => loadVoterData(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all shadow-lg shadow-blue-500/25"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={36} className="group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-base font-black text-white">Voter Dashboard</span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline ml-2">
                • Electors Hub
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadVoterData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs transition-all flex items-center gap-1.5"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              Admin Workspace →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <VoterStatsOverview stats={data?.stats} />

        {/* Quick Ballot Code Entry Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/30 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Have an Election or Invitation Code?
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Enter your private invite code, token, or election ID to access your secret ballot directly.
              </p>
            </div>

            <form onSubmit={handleAccessCodeSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter code or paste URL..."
                  className="w-full sm:w-64 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all shadow-md shadow-blue-500/20 shrink-0"
              >
                <span>Enter Ballot</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
          {accessCodeError && (
            <p className="text-xs text-red-400 mt-2 font-medium">{accessCodeError}</p>
          )}
        </div>

        {/* Search and Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto text-xs font-semibold text-slate-400">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:text-white'
              }`}
            >
              All ({rawActiveToVote.length + rawVoted.length + rawUpcoming.length + rawConcluded.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'active'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:text-white'
              }`}
            >
              <Radio className="h-3 w-3 text-blue-300" />
              <span>Ready to Vote ({rawActiveToVote.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('voted')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'voted'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:text-white'
              }`}
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Voted ({rawVoted.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:text-white'
              }`}
            >
              <Calendar className="h-3 w-3 text-amber-400" />
              <span>Upcoming ({rawUpcoming.length})</span>
            </button>
            {rawConcluded.length > 0 && (
              <button
                onClick={() => setActiveTab('concluded')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'concluded'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:text-white'
                }`}
              >
                <Archive className="h-3 w-3 text-slate-400" />
                <span>Concluded ({rawConcluded.length})</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search elections, orgs..."
              className="w-full sm:w-60 bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* 1. Active Ballots Section */}
        {(activeTab === 'all' || activeTab === 'active') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-blue-400 animate-pulse" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Active Ballots Ready to Vote
                </h2>
              </div>
              <span className="text-xs font-semibold text-blue-400">
                {activeToVote.length} Available
              </span>
            </div>

            <div className="space-y-4">
              {activeToVote.map((election) => (
                <VoterElectionCard key={election.electionId} election={election} />
              ))}

              {activeToVote.length === 0 && (
                <div className="p-8 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-slate-500">
                  <Vote className="h-8 w-8 mx-auto mb-2 text-slate-600 opacity-60" />
                  <p className="text-sm font-medium">You have no active ballots to vote on right now.</p>
                  <p className="text-xs mt-1">When an organization opens voting, your ballot will appear here.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2. Voted Ballots & Receipt History Section */}
        {(activeTab === 'all' || activeTab === 'voted') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Ballot History & Verified Receipts
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {voted.length} Cast
              </span>
            </div>

            <div className="space-y-3">
              {voted.map((election) => (
                <ReceiptHistoryCard key={election.electionId} election={election} />
              ))}

              {voted.length === 0 && (
                <div className="p-8 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-slate-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-slate-600 opacity-60" />
                  <p className="text-sm font-medium">No votes recorded yet.</p>
                  <p className="text-xs mt-1">Once you cast a ballot, your cryptographically verifiable receipt will appear here.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. Upcoming Scheduled Elections */}
        {(activeTab === 'all' || activeTab === 'upcoming') && upcoming.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Upcoming Scheduled Elections
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcoming.map((election) => (
                <div
                  key={election.electionId}
                  className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-amber-500/30 transition-all"
                >
                  <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Opens {election.startDate ? new Date(election.startDate).toLocaleDateString() : 'Soon'}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{election.title}</h3>
                  <div className="text-xs text-slate-400">
                    {election.organization?.name} • {election.positionsCount} Positions
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Concluded Elections */}
        {(activeTab === 'all' || activeTab === 'concluded') && concluded.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Past & Concluded Elections
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {concluded.map((election) => (
                <div
                  key={election.electionId}
                  className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="uppercase font-semibold tracking-wider">
                      {election.status === 'published' ? 'Certified Results' : 'Ended'}
                    </span>
                    <span>{election.organization?.name}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{election.title}</h3>
                  <div className="pt-2">
                    <Link
                      href={`/e/${election.electionId}/results`}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                    >
                      View Election Tally →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Enrolled Organization Rosters */}
        {organizations.length > 0 && (
          <section className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-400" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Enrolled Organization Rosters
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                {organizations.length} Active {organizations.length === 1 ? 'Roster' : 'Rosters'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {organizations.map((org) => (
                <Link
                  key={org.id}
                  href={`/org/${org.slug}`}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900 transition-all flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    {org.logo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building2 className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                      {org.name}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {org.type || 'Organization'} Portal →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Global Search Empty State */}
        {searchQuery && totalFiltered === 0 && (
          <div className="p-12 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-slate-400 space-y-2">
            <Filter className="h-8 w-8 mx-auto text-slate-600 mb-1" />
            <p className="text-sm font-bold text-white">No matching elections found</p>
            <p className="text-xs text-slate-500">
              No results for &ldquo;{searchQuery}&rdquo;. Try clearing your search query.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Clear Search
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
