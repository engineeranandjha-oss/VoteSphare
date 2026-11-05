'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import TurnoutWidget from '@/components/results/TurnoutWidget';
import PositionResultCard from '@/components/results/PositionResultCard';
import ResultsExportBar from '@/components/results/ResultsExportBar';
import QuorumBreakdownCard from '@/components/results/QuorumBreakdownCard';
import RunoffModal from '@/components/results/RunoffModal';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Lock,
  AlertTriangle,
  GitFork,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function PublicResultsPage({ params }) {
  const { electionId } = params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showRunoffModal, setShowRunoffModal] = useState(false);

  const fetchResults = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      setError(null);

      const res = await fetch(`/api/elections/${electionId}/results`, {
        cache: 'no-store',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to load election results');
      }

      setData(json.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'An error occurred while loading results');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Loading Skeleton
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-10 bg-slate-900 rounded-xl w-3/4 animate-pulse" />
          <div className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
        </div>
      </main>
    );
  }

  // Error Screen
  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Unable to Load Results</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Election results are unavailable.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchResults(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all"
            >
              Retry
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isPublished = data.status === 'published' || data.isCertified;
  const isLive = data.status === 'live';
  const isEnded = data.status === 'ended';

  const hasRunoffs = data.hasRunoffsRequired || (data.positions && data.positions.some((p) => p.requiresRunoff || p.isTie || p.status === 'tie'));
  const childElectionId = data.config?.runoff?.childElectionId;
  const childElectionTitle = data.config?.runoff?.childElectionTitle;
  const hasChildRunoff = Boolean(childElectionId);
  const canStartRunoff = !hasChildRunoff && (hasRunoffs || data.hasTies);
  const positionsToRunoff = (data.positions || []).filter((p) => p.requiresRunoff || p.isTie || p.status === 'tie');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Navigation & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/e/${electionId}`}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ballot Overview</span>
            </Link>

            {isPublished && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5" /> Certified Official Results
              </span>
            )}
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Live Turnout
              </span>
            )}
            {isEnded && !isPublished && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span>⏳</span> Certification In Progress
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {lastUpdated && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                Updated {lastUpdated}
              </span>
            )}
            <button
              onClick={() => fetchResults(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs flex items-center gap-1"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
              VoteSphere Official Results Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {data.electionTitle || 'Election Results'}
            </h1>
            {data.config?.runoff?.isRunoff && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                <span>⚡</span> Runoff Round {data.config.runoff.round || 2}
              </div>
            )}
            {data.organization && (
              <p className="text-sm font-medium text-slate-400 mt-2">
                Organized by <strong className="text-slate-200">{data.organization.name}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Linked Child Runoff Active Banner for Electors */}
        {data.config?.runoff?.childElectionId && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                <GitFork className="h-5 w-5" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-white text-sm">
                  Runoff Round In Progress
                </div>
                <p className="text-slate-300 leading-relaxed">
                  A linked runoff election (<strong>{data.config.runoff.childElectionTitle || 'Runoff Round'}</strong>) is active to resolve undecided positions.
                </p>
              </div>
            </div>

            <Link
              href={`/e/${data.config.runoff.childElectionId}`}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>Go to Runoff Ballot</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Runoff Required Action Callout */}
        {canStartRunoff && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/70 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                  ⚡ Deadlock Resolution
                </div>
                <h3 className="font-bold text-white text-base">
                  Runoff Required — No Unique Winner Determined
                </h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Positions in this election require a runoff round according to the election rules. VoteSphere can automatically initialize the linked runoff round while preserving this election as immutable Round 1.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRunoffModal(true)}
              className="shrink-0 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all cursor-pointer flex items-center gap-2 self-start sm:self-center"
            >
              <GitFork className="h-4 w-4" />
              <span>Start Runoff</span>
            </button>
          </div>
        )}

        {/* Turnout Overview Widget */}
        {data.turnout && (
          <TurnoutWidget
            turnout={data.turnout}
            quorum={data.quorum}
            isLive={isLive}
          />
        )}

        {/* Quorum Breakdown Card */}
        <QuorumBreakdownCard
          quorum={data.quorum}
          turnout={data.turnout}
        />

        {/* Certified Positions vs Live Turnout Protection */}
        {isPublished && data.positions && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Position Results & Winners
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {data.positions.length} Positions Tallied
              </span>
            </div>

            <div className="space-y-6">
              {data.positions.map((pos) => (
                <PositionResultCard
                  key={pos.positionId}
                  position={pos}
                  canStartRunoff={canStartRunoff}
                  onStartRunoff={() => setShowRunoffModal(true)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Live Voting In Progress Callout */}
        {isLive && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-8 text-center shadow-xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Ballot Secrecy & Candidate Tallies Protected
            </h3>
            <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
              Voting is currently active. To safeguard voter secrecy and avoid influencing decisions, individual candidate vote counts and winners will be certified and released once polls close.
            </p>
            <div className="mt-5">
              <Link
                href={`/e/${electionId}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
              >
                Cast Your Ballot 🗳️
              </Link>
            </div>
          </div>
        )}

        {/* Concluded Pending Certification Callout */}
        {isEnded && !isPublished && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 text-center shadow-xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Voting Concluded — Official Certification in Progress
            </h3>
            <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
              Ballot collection has ended. Administrators are verifying participation and sealing the official results snapshot. Please check back shortly for final certified winners.
            </p>
          </div>
        )}

        {/* Export & Reporting Bar */}
        <ResultsExportBar data={data} />

        {/* Footer */}
        <div className="pt-8 pb-4 text-center border-t border-slate-900 text-xs text-slate-500">
          Powered by <strong>VoteSphere</strong> — Secure, Anonymous & Multi-Tenant Voting Engine
        </div>
      </div>

      {/* Runoff Creation Review & Confirmation Modal */}
      <RunoffModal
        isOpen={showRunoffModal}
        onClose={() => setShowRunoffModal(false)}
        electionId={electionId}
        electionTitle={data.electionTitle}
        round={data.config?.runoff?.round || 1}
        orgId={data.orgId || data.organization?.id}
        votingRule={data.config?.winningRule || 'plurality'}
        totalEligibleVoters={data.turnout?.totalEligible || 0}
        positionsToRunoff={positionsToRunoff}
        onRunoffCreated={(runoff) => {
          fetchResults(false);
          if (runoff?.id) {
            window.location.href = `/e/${runoff.id}`;
          }
        }}
      />
    </main>
  );
}
