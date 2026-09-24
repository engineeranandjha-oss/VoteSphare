'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, ShieldCheck, Copy, Check, BarChart2 } from 'lucide-react';

export default function ReceiptHistoryCard({ election }) {
  const [copied, setCopied] = useState(false);
  const orgName = election.organization?.name || 'Organization';
  const orgSlug = election.organization?.slug;
  const isCertified = election.status === 'published';

  const votedDateFormatted = election.votedAt
    ? new Date(election.votedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const handleCopyReceipt = async () => {
    if (!election.eligibilityId) return;
    try {
      await navigator.clipboard.writeText(election.eligibilityId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      {/* Left Details */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="text-base sm:text-lg font-bold text-white">{election.title}</h4>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3 w-3" />
              Ballot Sealed & Recorded
            </span>
            {isCertified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Certified Tally
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
            {orgSlug ? (
              <Link href={`/org/${orgSlug}`} className="hover:text-blue-400 font-medium transition-colors">
                {orgName}
              </Link>
            ) : (
              <span>{orgName}</span>
            )}
            {votedDateFormatted && (
              <>
                <span className="text-slate-600">•</span>
                <span>Voted on {votedDateFormatted}</span>
              </>
            )}
          </div>

          {/* Receipt Hash / ID snippet */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Receipt ID:</span>
            <span className="font-mono text-xs text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
              {election.eligibilityId ? `${election.eligibilityId.slice(0, 16)}...` : 'N/A'}
            </span>
            {election.eligibilityId && (
              <button
                onClick={handleCopyReceipt}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Copy full receipt ID"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto shrink-0">
        <Link
          href={`/verify?receipt=${election.eligibilityId || ''}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all border border-slate-700/60"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span>Verify Receipt</span>
        </Link>

        <Link
          href={`/e/${election.electionId}/results`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20"
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span>{isCertified ? 'Certified Results' : 'Live Results'}</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </Link>
      </div>
    </div>
  );
}
