'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import LiveElectionCard from '@/components/dashboard/LiveElectionCard';
import ElectionTable from '@/components/dashboard/ElectionTable';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { Radio, Users, Vote, Percent, Plus } from 'lucide-react';
import Link from 'next/link';

export default function OrgDashboardPage({ params }) {
  const { orgId } = params;
  const [org, setOrg] = useState(null);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Organization details & Elections list in parallel
      const [orgRes, electionsRes] = await Promise.all([
        fetch(`/api/orgs/${orgId}`),
        fetch(`/api/orgs/${orgId}/elections?limit=50`),
      ]);

      const orgJson = await orgRes.json();
      const electionsJson = await electionsRes.json();

      if (!orgRes.ok) {
        throw new Error(orgJson.message || 'Failed to fetch organization details');
      }

      setOrg(orgJson.data);
      setElections(electionsJson.data?.elections || electionsJson.data || []);
    } catch (err) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-14 bg-slate-900 rounded-2xl w-full animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-32 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="h-32 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="h-32 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="h-32 bg-slate-900 rounded-3xl animate-pulse" />
          </div>
          <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !org) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Dashboard Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Organization not found.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchDashboardData()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all"
            >
              Retry
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 transition-all"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Aggregate Calculations
  const liveElections = elections.filter((e) => e.status === 'live');
  const totalElectionsCount = elections.length;

  let totalVotesSum = 0;
  let totalEligibleSum = 0;
  for (const e of elections) {
    totalVotesSum += e.stats?.totalVotes || 0;
    totalEligibleSum += e.stats?.eligibleVoterCount || 0;
  }

  const averageTurnout =
    totalEligibleSum > 0 ? Number(((totalVotesSum / totalEligibleSum) * 100).toFixed(1)) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Header Bar */}
      <DashboardHeader org={org} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards Grid */}
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

        {/* Live Election Spotlight */}
        {liveElections.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                Active Election Spotlight
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {liveElections.length} Live
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {liveElections.map((elec) => (
                <LiveElectionCard key={elec.id} election={elec} orgId={orgId} />
              ))}
            </div>
          </div>
        )}

        {/* Elections Table & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ElectionTable elections={elections} orgId={orgId} />
          </div>
          <div className="space-y-6">
            <ActivityFeed />

            {/* Quick Actions Card */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl backdrop-blur-md">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Quick Shortcuts
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/org/${orgId}/elections/new`}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-white transition-all border border-slate-700/50"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-400" /> New Election Ballot
                  </span>
                  <span>→</span>
                </Link>
                <Link
                  href={`/org/${orgId}/members`}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-white transition-all border border-slate-700/50"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" /> Invite Voters & Staff
                  </span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
