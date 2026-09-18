'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Check, Sparkles, Lock, RefreshCw, Award } from 'lucide-react';

export default function HeroSection() {
  const [selectedCandidate, setSelectedCandidate] = useState('cand-1');
  const [isVoted, setIsVoted] = useState(false);

  const candidates = [
    { id: 'cand-1', name: 'Dr. Sarah Mitchell', role: 'Dean of Sciences', votes: 142 },
    { id: 'cand-2', name: 'Prof. Alex Thorne', role: 'Faculty Senate Chair', votes: 98 },
    { id: 'cand-3', name: 'Elena Rostova', role: 'Student Union Representative', votes: 64 },
  ];

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-purple-600/10 rounded-full blur-[140px] -z-10" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Text & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Cryptographically Dissociated Ballot Anonymity</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Next-Generation Online Voting for{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Uncompromising Trust
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Empower universities, student governments, clubs, and organizations with verifiable
              ballot secrecy, multi-rule results calculation, and real-time certified public audits.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
              >
                Launch Your Election
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                Explore Interactive Demo
              </a>
            </div>

            {/* Key Value Micro-Stats */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="text-2xl font-black text-white">100%</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Anonymous Ballots</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400">0 ms</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Identity Correlation</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-400">SHA-256</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Blind Audit Receipts</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Ballot Card */}
          <div id="demo" className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 shadow-2xl backdrop-blur-xl transition-all hover:border-slate-700/80">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                    <Lock className="h-3.5 w-3.5" />
                    Interactive Ballot Demo
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">University Senate President</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Voting
                </span>
              </div>

              {/* Candidate Options */}
              <div className="mt-5 space-y-3">
                {candidates.map((cand) => {
                  const isSelected = selectedCandidate === cand.id;
                  return (
                    <button
                      key={cand.id}
                      type="button"
                      disabled={isVoted}
                      onClick={() => setSelectedCandidate(cand.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {cand.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{cand.name}</div>
                          <div className="text-xs text-slate-400">{cand.role}</div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-slate-600 bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Ballot Action / Confirmation */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                {!isVoted ? (
                  <button
                    type="button"
                    onClick={() => setIsVoted(true)}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Cast Anonymous Ballot 🗳️
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                        <Check className="h-4 w-4" />
                        Ballot Successfully Sealed & Recorded
                      </div>
                      <div className="font-mono text-xs text-slate-300 mt-1 font-semibold">
                        Receipt: VS-8F4A-21E9-7C0B
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVoted(false)}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reset Interactive Demo
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Identity Disconnected
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" /> Single-Vote Enforced
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
