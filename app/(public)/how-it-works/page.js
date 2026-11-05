import Link from 'next/link';
import {
  Building2,
  Layers,
  Users,
  Vote,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'How It Works — VoteSphere Election Lifecycle',
  description:
    'Learn how VoteSphere enables seamless election creation, voter invitation, ballot casting, and certified outcome publishing.',
};

const steps = [
  {
    number: '01',
    title: 'Create Your Election',
    desc: 'Set up your organization, election, positions, candidates, and voting rules.',
    icon: Building2,
    color: 'from-blue-600 to-indigo-600',
    details: [
      'Custom organization workspace and profile',
      'Role-based access (Owners, Admins, Election Managers)',
      'Centralized election and candidate configuration',
    ],
  },
  {
    number: '02',
    title: 'Add Eligible Voters',
    desc: 'Build your voter list and define who can participate.',
    icon: Users,
    color: 'from-indigo-600 to-purple-600',
    details: [
      'CSV roster import and deduplication',
      'Eligibility rules based on organization membership',
      'Dedicated voter access controls',
    ],
  },
  {
    number: '03',
    title: 'Share the Ballot',
    desc: 'Invite voters through secure links, QR codes, and available sharing channels.',
    icon: Layers,
    color: 'from-purple-600 to-pink-600',
    details: [
      'Direct voting link and shareable invites',
      'Printable high-resolution QR codes',
      'Multi-channel dispatch via email and messaging',
    ],
  },
  {
    number: '04',
    title: 'Collect Votes',
    desc: 'Voters securely access their ballot and submit their choices.',
    icon: Vote,
    color: 'from-emerald-600 to-teal-600',
    details: [
      'Mobile-first responsive ballot casting',
      'One-vote safeguards with server-side validation',
      'Real-time turnout monitoring without premature result leaks',
    ],
  },
  {
    number: '05',
    title: 'Publish & Verify Results',
    desc: 'Review participation, publish results, and provide verifiable election records.',
    icon: Award,
    color: 'from-amber-600 to-orange-600',
    details: [
      'Multi-rule outcome calculator (Plurality, Majority, Multi-Seat)',
      'Public results URL and verifiable receipts',
      'Transparent audit log of all election lifecycle actions',
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Product Workflow</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Run Your Election From Start to Finish
          </h1>
          <p className="text-base sm:text-lg text-slate-400">
            Set up your election, invite eligible voters, collect ballots, and publish verifiable results through one connected workflow.
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="flex flex-col md:flex-row items-start gap-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-10 shadow-xl relative overflow-hidden"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-2xl font-black text-white shadow-lg">
                  {step.number}
                </div>

                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-blue-400" />
                    <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">{step.desc}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {step.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Notice */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 flex items-start gap-4 text-xs text-slate-400">
          <ShieldCheck className="h-6 w-6 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-sm text-white">Integrity & Confidentiality Guaranteed</strong>
            <p>
              VoteSphere strictly decouples voter identities from ballot choices for anonymous elections, while logging all administrative lifecycle changes in tamper-evident audit logs.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <Link
            href="/onboarding/organization"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition-all"
          >
            <span>Create an Election</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
