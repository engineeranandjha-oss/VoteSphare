'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Radio, ExternalLink, Settings, Copy, Check } from 'lucide-react';

export default function LiveElectionCard({ election, orgId }) {
  const [copied, setCopied] = useState(false);

  const title = election.title || 'Untitled Election';
  const stats = election.stats || {};
  const totalEligible = stats.eligibleVoterCount || 0;
  const totalVoted = stats.totalVotes || 0;
  const turnoutPercentage =
    totalEligible > 0 ? Number(((totalVoted / totalEligible) * 100).toFixed(1)) : 0;

  const endDateFormatted = election.endDate
    ? new Date(election.endDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No end date';

  function handleCopyVotingLink() {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/e/${election.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/20 border border-blue-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Top Badge & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm animate-pulse">
            <Radio className="h-3.5 w-3.5 text-blue-400 animate-spin" />
            LIVE VOTING IN PROGRESS
          </span>
          <span className="text-xs text-slate-500 font-medium">Closes {endDateFormatted}</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCopyVotingLink}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 border border-slate-700/60"
            title="Copy Public Voting Link"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Ballot Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="my-5">
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
        {election.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{election.description}</p>
        )}

        {/* Turnout Progress */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">
              {totalVoted} Cast of {totalEligible} Electors
            </span>
            <span className="font-black text-blue-400 text-sm">{turnoutPercentage}% Turnout</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, turnoutPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
          <span>{stats.positionCount || 0} Positions</span>
          <span>•</span>
          <span>{stats.candidateCount || 0} Candidates</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/e/${election.id}/results`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all border border-slate-700"
          >
            <span>Live Turnout</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/org/${orgId}/elections/${election.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Manage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
