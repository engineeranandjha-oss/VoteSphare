'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  BarChart3,
  Home,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { downloadBallotReceiptPdf } from '@/lib/utils/receipt-pdf';

export default function VoteSuccessReceipt({ receipt }) {
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!receipt) return null;

  const {
    receiptId = 'VS-UNKNOWN',
    electionId = '',
    electionTitle = 'Election',
    timestamp = new Date().toISOString(),
    positionsVotedCount = 0,
    isAnonymous = true,
  } = receipt;

  function handleCopyReceipt() {
    if (typeof window !== 'undefined' && receiptId) {
      navigator.clipboard.writeText(receiptId);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  async function handleDownloadReceipt() {
    if (typeof window === 'undefined') return;

    try {
      setDownloadingPdf(true);
      await downloadBallotReceiptPdf({
        receiptId,
        electionId,
        electionTitle,
        timestamp,
        positionsVotedCount,
        isAnonymous,
      });
    } catch (err) {
      console.error('Failed to generate ballot receipt PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="max-w-xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
      {/* Success Seal Icon */}
      <div className="relative mx-auto w-20 h-20">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </div>
      </div>

      {/* Title & Election Info */}
      <div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
          Ballot Sealed
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-3">
          Vote Successfully Cast!
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Your selections have been recorded anonymously for{' '}
          <strong className="text-blue-400 font-semibold">{electionTitle}</strong>.
        </p>
      </div>

      {/* Cryptographic Receipt Card */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-left space-y-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 text-blue-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Cryptographic Receipt</span>
          </div>
          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Verified Hash
          </span>
        </div>

        <div>
          <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400 tracking-wider break-all select-all bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
            {receiptId}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Save this cryptographic hash to independently verify that your ballot was tallied.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between text-xs text-slate-400 gap-2">
          <span>Positions Voted: <strong className="text-slate-200">{positionsVotedCount}</strong></span>
          <span>{new Date(timestamp).toLocaleString()}</span>
        </div>
      </div>

      {/* Primary Actions: Copy & Download */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleCopyReceipt}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400">Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-slate-300" />
              <span>Copy Receipt Code</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownloadReceipt}
          disabled={downloadingPdf}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          {downloadingPdf ? (
            <>
              <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 text-slate-300" />
              <span>Download Ballot Receipt (PDF)</span>
            </>
          )}
        </button>
      </div>

      {/* Secondary Actions: Results & Home */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={`/e/${electionId}/results`}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>View Live Turnout & Results</span>
          <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
        </Link>

        <Link
          href="/voter"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Voter Portal</span>
        </Link>
      </div>
    </div>
  );
}
