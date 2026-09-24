import Link from 'next/link';
import {
  Building2,
  Users,
  Layers,
  Vote,
  Award,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function FeatureGrid() {
  const organizerCapabilities = [
    {
      icon: Building2,
      title: 'Create Your Organization',
      desc: 'Set up custom branded workspaces with member roles (Owner, Admin, Member, Voter).',
    },
    {
      icon: Users,
      title: 'Import & Invite Rosters',
      desc: 'Upload voter lists via CSV or invite participants with one-click email and WhatsApp links.',
    },
    {
      icon: Layers,
      title: 'Configure Positions & Candidates',
      desc: 'Build multi-position ballots with candidate manifestos, photo bios, and winner thresholds.',
    },
    {
      icon: Vote,
      title: 'Track Turnout in Real Time',
      desc: 'Monitor participation percentages live while strictly shielding interim vote choices.',
    },
    {
      icon: Award,
      title: 'Publish Certified Outcomes',
      desc: 'Seal results upon poll closure and export outcome sheets with complete audit trails.',
    },
    {
      icon: Send,
      title: 'Share Verified Results',
      desc: 'Distribute public results pages, turnout charts, and high-resolution QR codes.',
    },
  ];

  const voterSteps = [
    {
      step: '1',
      title: 'Open Secure Link',
      desc: 'Access the ballot directly from your email invitation, WhatsApp link, or election code.',
    },
    {
      step: '2',
      title: 'Verify Eligibility',
      desc: 'Sign in with Google or confirm your organization membership to access your ballot.',
    },
    {
      step: '3',
      title: 'Review Candidates',
      desc: 'Read candidate bios, platforms, and manifestos directly inside the clean ballot interface.',
    },
    {
      step: '4',
      title: 'Submit & Confirm',
      desc: 'Cast your selections with one-vote enforcement and receive an instant submission confirmation.',
    },
  ];

  return (
    <div className="space-y-24 py-12">
      {/* 1. Organizer Capabilities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Administrative Power</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Built for the People Who Run Elections
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Everything election commissioners, school administrators, committee chairs, and team leads need to manage fair elections without technical friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizerCapabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-7 shadow-xl hover:border-slate-700 hover:bg-slate-900 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-5 group-hover:scale-105 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/onboarding/organization"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
          >
            <span>Set up an election workspace for your team</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* 2. Voter Experience Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 sm:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Vote className="h-3.5 w-3.5" />
              <span>Voter-First Usability</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              A Clear Voting Experience for Every Voter
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Designed for maximum accessibility on mobile phones, tablets, and desktops. No app download required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {voterSteps.map((step, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-black">
                  {step.step}
                </div>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Ballots are cast with one-vote safeguards and configurable privacy rules.</span>
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
