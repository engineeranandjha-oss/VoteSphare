'use client';

import { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Vote,
  Globe,
} from 'lucide-react';
import { generateShareableLinks } from '@/lib/sharing/links';

export default function VotingLinkCard({
  electionId,
  electionTitle = 'Election',
  orgSlug = null,
}) {
  const [links, setLinks] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    if (!electionId) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const generated = generateShareableLinks(
      { id: electionId, title: electionTitle, organization: orgSlug ? { slug: orgSlug } : null },
      baseUrl
    );
    setLinks(generated);
  }, [electionId, electionTitle, orgSlug]);

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
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Official Voting Links</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Share these verified links with eligible voters across your community
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowEmbed((prev) => !prev)}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Code2 className="h-3.5 w-3.5 text-indigo-400" />
          <span>{showEmbed ? 'Hide Embed' : 'Embed Widget'}</span>
        </button>
      </div>

      {/* Main Public Voting Overview Link */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <span>Public Ballot & Overview URL</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl font-mono text-xs text-blue-300 truncate select-all">
            {links.publicUrl}
          </div>
          <button
            type="button"
            onClick={() => handleCopy(links.publicUrl, 'public')}
            className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copiedKey === 'public' ? (
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
            href={links.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0"
            title="Open link in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Direct Voting Booth URL */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Vote className="h-3.5 w-3.5 text-emerald-400" />
          <span>Direct Voting Booth URL (Bypasses Overview)</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl font-mono text-xs text-emerald-300 truncate select-all">
            {links.voteUrl}
          </div>
          <button
            type="button"
            onClick={() => handleCopy(links.voteUrl, 'direct')}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copiedKey === 'direct' ? (
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
          <a
            href={links.voteUrl}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0"
            title="Open voting booth in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Vanity URL (If Organization Slug Exists) */}
      {links.vanityUrl && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="text-purple-400">🏛️</span>
            <span>Branded Organization URL</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl font-mono text-xs text-purple-300 truncate select-all">
              {links.vanityUrl}
            </div>
            <button
              type="button"
              onClick={() => handleCopy(links.vanityUrl, 'vanity')}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedKey === 'vanity' ? (
                <>
                  <Check className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400">Copied</span>
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
      )}

      {/* Embed Code Snippet Drawer */}
      {showEmbed && (
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>HTML iFrame Embed Code</span>
            <button
              type="button"
              onClick={() => handleCopy(links.iframeEmbedCode, 'embed')}
              className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'embed' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === 'embed' ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto select-all">
            {links.iframeEmbedCode}
          </pre>
          <p className="text-[11px] text-slate-500">
            Paste this snippet into your portal or intranet CMS to embed the live voting widget.
          </p>
        </div>
      )}
    </div>
  );
}
