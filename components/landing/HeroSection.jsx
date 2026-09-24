'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Vote,
  ShieldCheck,
  Calendar,
  Users,
  Building2,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-purple-600/10 rounded-full blur-[140px] -z-10" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Text & Real CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Trusted Online Election Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Create, run, and share{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                trusted elections online.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              VoteSphere helps schools, universities, companies, societies, NGOs, families, and groups create elections, invite eligible voters, collect ballots, and publish results with confidence.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/onboarding/organization"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>Create an Election</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/join"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-slate-200 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all shadow-md"
              >
                <Vote className="h-4 w-4 text-emerald-400" />
                <span>Join an Election</span>
              </Link>
            </div>

            {/* Product Capabilities Badges */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <div className="text-lg sm:text-xl font-black text-white">6 Org Types</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Schools, Orgs & Groups</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-emerald-400">Multi-Rule</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Plurality, Majority & Multi-Seat</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-blue-400">Shareable</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Verified Links & QR Codes</div>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Election Preview Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
              {/* Organization Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Apex University
                    </h3>
                    <div className="text-sm font-bold text-white">Student Council 2026</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Scheduled
                </span>
              </div>

              {/* Election Details */}
              <div className="py-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Users className="h-4 w-4 text-blue-400" />
                    Eligible Electors:
                  </span>
                  <strong className="text-white font-mono">1,240 Verified Students</strong>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Vote className="h-4 w-4 text-emerald-400" />
                    Positions to Elect:
                  </span>
                  <strong className="text-white">4 Positions (12 Candidates)</strong>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    Voting Window:
                  </span>
                  <strong className="text-white">Oct 12 – Oct 14, 2026</strong>
                </div>
              </div>

              {/* Workflow Footnote */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Configured with one-vote enforcement & student eligibility roster</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/organizations/universities"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <span>View Use Case</span>
                  </Link>

                  <Link
                    href="/join"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-xs font-semibold text-blue-400 border border-blue-500/20 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Join Election</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
