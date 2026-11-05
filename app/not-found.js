'use client';

import Link from 'next/link';
import {
  Vote,
  Compass,
  ArrowRight,
  Home,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="max-w-2xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center relative z-10 space-y-8">
        {/* Top Icon Badge */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner text-blue-400">
          <Compass className="h-10 w-10 animate-spin" style={{ animationDuration: '20s' }} />
        </div>

        {/* 404 Heading & Explainer */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span>ERROR 404</span>
            <span>•</span>
            <span>PAGE NOT FOUND</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Lost in the Electorate?
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The election, ballot booth, organization portal, or URL you requested cannot be located.
            It may have ended, moved, or the link might be misspelled.
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <Link
            href="/"
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-950 transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                Return to Home
              </div>
              <div className="text-[11px] text-slate-400">
                VoteSphere Landing Hub
              </div>
            </div>
          </Link>

          <Link
            href="/voter"
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-950 transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Vote className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                Voter Dashboard
              </div>
              <div className="text-[11px] text-slate-400">
                Active ballots & receipts
              </div>
            </div>
          </Link>

          <Link
            href="/verify"
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-950 transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                Verify Receipt
              </div>
              <div className="text-[11px] text-slate-400">
                Audit cryptographic proof
              </div>
            </div>
          </Link>

          <Link
            href="/join"
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-950 transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                Join by Code
              </div>
              <div className="text-[11px] text-slate-400">
                Enter ballot or invite code
              </div>
            </div>
          </Link>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs sm:text-sm text-white shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <span>Back to VoteSphere</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
