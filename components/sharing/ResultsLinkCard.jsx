'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Radio,
  Share2,
} from 'lucide-react';
import { generateResultsShareLinks } from '@/lib/sharing/links';

export default function ResultsLinkCard({
  electionId,
  electionTitle = 'Election',
  orgSlug = null,
  status = 'live',
  snapshotHash = null,
}) {
  const [links, setLinks] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (!electionId) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const generated = generateResultsShareLinks(
      {
        id: electionId,
        title: electionTitle,
        status,
        organization: orgSlug ? { slug: orgSlug } : null,
      },
      baseUrl,
      { snapshotHash }
    );
    setLinks(generated);
  }, [electionId, electionTitle, orgSlug, status, snapshotHash]);

  function handleCopy(text, key) {
    if (typeof window !== 'undefined' && text) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 3000);
    }
  }

  if (!links) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Official Results & Turnout Links
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Public transparency links for voters, auditors, and media
            </p>
          </div>
        </div>

        <div>
          {links.isCertified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-3.5 w-3.5" /> Certified Results Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">
              <Radio className="h-3.5 w-3.5" /> Live Turnout Open
            </span>
          )}
        </div>
      </div>

      {/* Main Results Portal Link */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
          <span>Public Results & Winners Portal</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl font-mono text-xs text-blue-300 truncate select-all">
            {links.resultsUrl}
          </div>
          <button
            type="button"
            onClick={() => handleCopy(links.resultsUrl, 'results')}
            className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copiedKey === 'results' ? (
              <>
                <Check className="h-4 w-4 text-white" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
          <a
            href={links.resultsUrl}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0"
            title="Open results in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Live Turnout Tracking Deep-Link */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-emerald-400" />
          <span>Direct Live Turnout Deep-Link</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl font-mono text-xs text-emerald-300 truncate select-all">
            {links.turnoutUrl}
          </div>
          <button
            type="button"
            onClick={() => handleCopy(links.turnoutUrl, 'turnout')}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copiedKey === 'turnout' ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verification Hash Deep-Link */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          <span>Ledger Snapshot Verification URL</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl font-mono text-xs text-indigo-300 truncate select-all">
            {links.verificationUrl}
          </div>
          <button
            type="button"
            onClick={() => handleCopy(links.verificationUrl, 'verify')}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copiedKey === 'verify' ? (
              <>
                <Check className="h-4 w-4 text-indigo-400" />
                <span className="text-indigo-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Share Announcement Text Snippet */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5 text-purple-400" />
            <span>Ready-to-Post Social Announcement</span>
          </span>
          <button
            type="button"
            onClick={() => handleCopy(links.shareText, 'shareText')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            {copiedKey === 'shareText' ? 'Copied to Clipboard' : 'Copy Text'}
          </button>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/90 p-3 rounded-xl border border-slate-800 select-all">
          {links.shareText}
        </p>
      </div>
    </div>
  );
}
