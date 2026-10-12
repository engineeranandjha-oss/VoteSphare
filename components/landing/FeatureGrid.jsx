import Link from 'next/link';
import {
  Layers,
  ShieldCheck,
  Users,
  Award,
  Vote,
  UserCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function FeatureGrid() {
  const valuePropositionCards = [
    {
      icon: Layers,
      title: 'Easy Election Setup',
      desc: 'Create elections, configure positions and candidates, and prepare your ballot with guided workflows.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Voting',
      desc: 'Control voter eligibility and protect the integrity of every submitted ballot.',
    },
    {
      icon: Users,
      title: 'Simple Voter Access',
      desc: 'Share election links and QR codes so eligible voters can reach their ballot quickly.',
    },
    {
      icon: Award,
      title: 'Verifiable Results',
      desc: 'Publish results and provide cryptographic verification for election participation.',
    },
  ];

  const votingRules = [
    {
      title: 'Plurality',
      desc: 'The candidate with the most votes wins.',
      badge: 'Single Winner',
    },
    {
      title: 'Majority',
      desc: 'Require a candidate to reach the defined majority threshold.',
      badge: 'Threshold',
    },
    {
      title: 'Multi-Seat',
      desc: 'Elect multiple candidates from the same ballot.',
      badge: 'Multiple Winners',
    },
  ];

  return (
    <div className="space-y-24 py-12">
      {/* 1. Value Proposition Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Everything You Need to Run an Election
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            From setting up your ballot to verifying results, VoteSphere keeps the entire election workflow in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valuePropositionCards.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-7 shadow-xl hover:border-slate-700 hover:bg-slate-900 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/onboarding/organization"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
          >
            <span>Set up an election workspace for your organization</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* 2. Voting Rules / Capabilities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 sm:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Vote className="h-3.5 w-3.5" />
              <span>Voting Rules</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Choose the Voting Rule That Fits Your Election
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Different elections require different ways to determine results. Configure the voting method that matches your organization&apos;s rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {votingRules.map((rule, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-black">
                      {idx + 1}
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {rule.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{rule.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Configure winner thresholds and seat limits directly during ballot setup.</span>
            </div>
            <Link
              href="/join"
              className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              Have an election code? Join now →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
