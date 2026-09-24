'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ElectionHero from '@/components/elections/ElectionHero';
import EligibilityBanner from '@/components/elections/EligibilityBanner';
import PositionPreviewList from '@/components/elections/PositionPreviewList';
import RulesAndGuarantees from '@/components/elections/RulesAndGuarantees';
import { Copy, Check, BarChart3, ExternalLink } from 'lucide-react';

export default function PublicElectionPage({ params }) {
  const { electionId } = params;
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadElection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/elections/${electionId}`, { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to load election details');
      }

      setElection(json.data);
    } catch (err) {
      setError(err.message || 'Error loading election');
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    loadElection();
  }, [loadElection]);

  function handleCopyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-48 bg-slate-900 rounded-3xl animate-pulse" />
          <div className="h-20 bg-slate-900 rounded-3xl animate-pulse" />
          <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !election) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Election Not Found</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'This election is unavailable or does not exist.'}</p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all"
          >
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Utility Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            ← VoteSphere Home
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            <Link
              href={`/e/${electionId}/results`}
              target="_blank"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
              <span>Results & Turnout</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Hero Overview */}
        <ElectionHero election={election} />

        {/* 2. Voter Eligibility & Voting Booth Access Gate */}
        <EligibilityBanner
          electionId={electionId}
          electionStatus={election.status}
        />

        {/* 3. Contested Positions & Candidate Rosters */}
        <PositionPreviewList positions={election.positions || []} />

        {/* 4. Electoral Rules & Security Guarantees */}
        <RulesAndGuarantees config={election.config || {}} />

        {/* Footer */}
        <div className="pt-8 pb-4 text-center border-t border-slate-900 text-xs text-slate-500">
          Powered by <strong>VoteSphere</strong> — Verifiable Anonymous Voting Architecture
        </div>
      </main>
    </div>
  );
}
