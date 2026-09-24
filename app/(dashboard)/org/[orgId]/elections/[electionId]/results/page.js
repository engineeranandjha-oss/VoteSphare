'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import TurnoutWidget from '@/components/results/TurnoutWidget';
import PositionResultCard from '@/components/results/PositionResultCard';
import ResultsPublishControl from '@/components/results/ResultsPublishControl';
import ResultsExportBar from '@/components/results/ResultsExportBar';
import QuorumBreakdownCard from '@/components/results/QuorumBreakdownCard';
import { ArrowLeft, RefreshCw, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function AdminElectionResultsPage({ params }) {
  const { orgId, electionId } = params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{data.electionTitle}</h1>
          {data.organization && (
            <p className="text-xs text-slate-400">Organization: {data.organization.name}</p>
          )}
        </div>

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
                <PositionResultCard key={pos.positionId} position={pos} />
              ))}
            </div>
          </div>
        )}

        {/* Export & Reporting Bar */}
        <ResultsExportBar data={data} />
      </div>
    </div>
  );
}
