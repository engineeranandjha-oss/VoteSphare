import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Create Organization',
      desc: 'Set up your workspace for your school, company, society, or group.',
    },
    {
      num: '02',
      title: 'Build Election',
      desc: 'Configure positions, candidate manifestos, and voting rules.',
    },
    {
      num: '03',
      title: 'Invite Voters',
      desc: 'Import rosters via CSV, dispatch emails, or generate notice-board QR codes.',
    },
    {
      num: '04',
      title: 'Voters Verify & Vote',
      desc: 'Electors cast single-vote ballots from any smartphone or computer.',
    },
    {
      num: '05',
      title: 'Publish Results',
      desc: 'Close polls and share certified outcomes with public summary links.',
    },
  ];

  return (
    <section className="py-20 bg-slate-900/40 border-y border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Product Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            The 5-Step Civic Lifecycle
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Create → Invite → Join → Vote → Result → Share
          </p>
        </div>

        {/* 5-Step Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="text-2xl font-black text-blue-400 mb-3 font-mono">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Step {idx + 1}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
          >
            <span>Read full walkthrough of the election lifecycle</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
