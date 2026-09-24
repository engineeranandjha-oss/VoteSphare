import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Server,
  FileText,
  KeyRound,
  EyeOff,
  Database,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Security, Privacy & Trust — VoteSphere Architecture',
  description:
    'Learn how VoteSphere protects voter privacy, enforces eligibility, prevents duplicate votes, and maintains administrative auditability.',
};

const securityPillars = [
  {
    title: 'Verified Authentication',
    desc: 'Powered by Supabase Auth with Google OAuth integration, ensuring that voters and administrators verify their identities securely without password vulnerabilities.',
    icon: UserCheck,
  },
  {
    title: 'Multi-Tenant Organization Isolation',
    desc: 'Each organization operates in strict logical isolation. Access permissions are strictly enforced on every API route and database query with role-based controls (Owner, Admin, Member, Voter).',
    icon: Lock,
  },
  {
    title: 'Voter Eligibility Gates',
    desc: 'Ballots are only issued to electors who pass strict multi-point eligibility verification (active membership, roster enrollment, scheduled election window, and unvoted status).',
    icon: ShieldCheck,
  },
  {
    title: 'Server-Side Vote Validation',
    desc: 'Ballot submissions are validated server-side against Zod schemas, verifying that all selected candidates match approved positions and belong to the active election.',
    icon: Server,
  },
  {
    title: 'Duplicate-Vote Prevention',
    desc: 'Transactions atomically mark voter eligibility records as consumed before accepting votes, rendering replay attacks and multiple submissions impossible.',
    icon: KeyRound,
  },
  {
    title: 'Configurable Anonymity Model',
    desc: 'In anonymous elections, the stored Vote records are architecturally separated from user profiles and voter rosters, preventing administrators or database operators from correlating ballot choices back to individuals.',
    icon: EyeOff,
  },
  {
    title: 'Administrative Audit Logging',
    desc: 'Every sensitive management event (election creation, date modification, candidate addition, and results publication) is permanently recorded in the organization audit trail.',
    icon: FileText,
  },
  {
    title: 'Controlled Results Publishing',
    desc: 'Interim vote counts are never leaked or made publicly queryable while polls are open. Results are only computed and made accessible according to election settings upon closing.',
    icon: Database,
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Trust & Privacy Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Security & Privacy by Design
          </h1>
          <p className="text-base sm:text-lg text-slate-400">
            VoteSphere provides transparent, auditable, and privacy-preserving election infrastructure designed for organizations that take integrity seriously.
          </p>
        </div>

        {/* Disclaimer Alert */}
        <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 flex items-start gap-4 text-xs text-slate-300">
          <AlertTriangle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white text-sm">Security & Privacy Notice</strong>
            <p className="leading-relaxed">
              Voting privacy, participant visibility, and result publication rules depend on each election&apos;s configured settings. Election organizers can configure elections as fully anonymous or identifiable based on the requirements of their organization bylaws.
            </p>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{pillar.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Technical Guarantee Summary */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 sm:p-10 space-y-6">
          <h2 className="text-xl font-bold text-white">How Anonymity is Maintained</h2>
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              For elections marked as <strong>Anonymous</strong>, VoteSphere uses a dissociated data model. The table storing ballot choices contains no foreign keys or references to the voter&apos;s user ID, name, or email.
            </p>
            <p>
              When a vote is submitted, the voter&apos;s eligibility token is marked as <code className="text-blue-400 bg-slate-950 px-1.5 py-0.5 rounded">voted</code> in an isolated transaction to prevent double voting, while the vote choice itself is stored anonymously in a separate dataset.
            </p>
          </div>
        </div>

        {/* Action Banner */}
        <div className="text-center pt-4">
          <Link
            href="/onboarding/organization"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition-all"
          >
            <span>Run a Secure Election</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
