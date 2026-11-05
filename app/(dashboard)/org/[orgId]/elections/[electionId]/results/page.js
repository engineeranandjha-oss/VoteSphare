'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import TurnoutWidget from '@/components/results/TurnoutWidget';
import PositionResultCard from '@/components/results/PositionResultCard';
import ResultsPublishControl from '@/components/results/ResultsPublishControl';
import ResultsExportBar from '@/components/results/ResultsExportBar';
import QuorumBreakdownCard from '@/components/results/QuorumBreakdownCard';
import RunoffModal from '@/components/results/RunoffModal';
import ElectionCertificatesCard from '@/components/results/ElectionCertificatesCard';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ExternalLink,
  GitFork,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function AdminElectionResultsPage({ params }) {
  const { orgId, electionId } = params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showRunoffModal, setShowRunoffModal] = useState(false);

  const fetchResults = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      setError(null);

      const res = await fetch(`/api/elections/${electionId}/results`, {
        cache: 'no-store',
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to load election results');
      }

      setData(json.data);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching results');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-xs text-slate-400">Loading election analytics & tallies...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Unable to Load Election Results</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Results are currently unavailable.'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => fetchResults(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all"
            >
              Retry
            </button>
            <Link
              href={`/org/${orgId}/elections`}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-300 transition-all"
            >
              Back to Elections
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isLive = data.status === 'live';
  const hasRunoffs = data.hasRunoffsRequired || (data.positions && data.positions.some((p) => p.requiresRunoff || p.isTie || p.status === 'tie'));
  const childElectionId = data.config?.runoff?.childElectionId;
  const childElectionTitle = data.config?.runoff?.childElectionTitle;
  const hasChildRunoff = Boolean(childElectionId);
  const canStartRunoff = !hasChildRunoff && (hasRunoffs || data.hasTies);
  const positionsToRunoff = (data.positions || []).filter((p) => p.requiresRunoff || p.isTie || p.status === 'tie');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href={`/org/${orgId}/elections`}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Elections</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchResults(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs flex items-center gap-1.5"
              title="Refresh results"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <Link
              href={`/e/${electionId}/results`}
              target="_blank"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Public Results Page</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Election Results & Analytics
            </span>
            <span className="text-xs text-slate-400 capitalize">Status: {data.status}</span>
            {data.config?.runoff?.isRunoff && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                Runoff Round {data.config.runoff.round || 2}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{data.electionTitle}</h1>
          {data.organization && (
            <p className="text-xs text-slate-400">Organization: {data.organization.name}</p>
          )}
        </div>

        {/* Linked Child Runoff Already Active Banner */}
        {hasChildRunoff && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                <GitFork className="h-5 w-5" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-white text-sm">
                  Linked Runoff Round Active
                </div>
                <p className="text-slate-300">
                  A new voting round (<strong>{childElectionTitle || 'Runoff Election'}</strong>) was created to resolve tied positions.
                </p>
              </div>
            </div>

            <Link
              href={`/org/${orgId}/elections/${childElectionId}`}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>Manage Runoff Election</span>
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

        {/* Administrative Certification Control */}
        <ResultsPublishControl
          electionId={electionId}
          status={data.status}
          isCertified={data.isCertified}
          certificationDetails={data.certificationDetails}
          onStatusChange={() => fetchResults(false)}
        />

        {/* Turnout & Quorum Overview */}
        {data.turnout && (
          <TurnoutWidget
            turnout={data.turnout}
            quorum={data.quorum}
            isLive={isLive}
          />
        )}

        {/* Quorum Breakdown Analysis */}
        <QuorumBreakdownCard
          quorum={data.quorum}
          turnout={data.turnout}
        />

        {/* Position & Candidate Tallies */}
        {data.positions && data.positions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Position Results & Candidate Tallies
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {data.positions.length} Positions
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

        {/* Official Certificates Registry */}
        <ElectionCertificatesCard
          electionId={electionId}
          status={data.status}
          orgId={orgId}
        />

        {/* Export & Reporting Bar */}
        <ResultsExportBar data={data} />
      </div>

      {/* Runoff Creation Review & Confirmation Modal */}
      <RunoffModal
        isOpen={showRunoffModal}
        onClose={() => setShowRunoffModal(false)}
        electionId={electionId}
        electionTitle={data.electionTitle}
        round={data.config?.runoff?.round || 1}
        orgId={orgId}
        votingRule={data.config?.winningRule || 'plurality'}
        totalEligibleVoters={data.turnout?.totalEligible || 0}
        positionsToRunoff={positionsToRunoff}
        onRunoffCreated={(runoff) => {
          fetchResults(false);
          if (orgId && runoff?.id) {
            window.location.href = `/org/${orgId}/elections/${runoff.id}`;
          }
        }}
      />
    </div>
  );
}

