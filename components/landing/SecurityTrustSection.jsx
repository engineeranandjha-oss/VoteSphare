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
  AlertCircle,
} from 'lucide-react';

export default function SecurityTrustSection() {
  const securityPillars = [
    {
      icon: UserCheck,
      title: 'Verified Authentication',
      detail:
        'Secure Google authentication via Supabase Auth ensures that only authentic accounts participate in elections.',
    },
    {
      icon: Lock,
      title: 'Organization Authorization',
      detail:
        'Role-based permissions (Owners, Admins, Members, Voters) isolate election access and management operations.',
    },
    {
      icon: ShieldCheck,
      title: 'Eligibility Controls',
      detail:
        'Multi-point verification confirms voter membership, roster assignment, and unvoted status prior to ballot issuance.',
    },
    {
      icon: Server,
      title: 'Server-Side Validation',
      detail:
        'All ballot submissions are validated on the server against strict schemas to ensure valid candidate selections.',
    },
    {
      icon: KeyRound,
      title: 'Duplicate-Vote Prevention',
      detail:
        'Atomic database transactions lock eligibility records on submission, making replay and double-voting impossible.',
    },
    {
      icon: EyeOff,
      title: 'Configurable Anonymity',
      detail:
        'In anonymous elections, ballot choices are stored in a separate table without foreign keys linking to voter identities.',
    },
    {
      icon: FileText,
      title: 'Administrative Audit Logs',
      detail:
        'Every sensitive action—election creation, date change, and results publication—is logged with timestamps for transparency.',
    },
    {
      icon: Database,
      title: 'Controlled Publishing',
      detail:
        'Interim vote counts are shielded while polls are open, with results only published upon official closure by administrators.',
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-10">
            {/* Header */}
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Security & Integrity</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Designed for Trust, Privacy & Auditability
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
                VoteSphere combines modern web security, eligibility verification, and transparent audit logging so organizations can run elections with complete confidence.
              </p>
            </div>

            {/* Disclaimer Alert */}
            <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-slate-300">
              <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Configuration Notice: </strong>
                Voting privacy and visibility depend on each election&apos;s configured settings. Organizers can select anonymous or identifiable ballots based on organization requirements.
              </div>
            </div>

            {/* Guarantees Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {securityPillars.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                      <IconComp className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Link to Security Page */}
            <div className="pt-2 text-center sm:text-left">
              <Link
                href="/security"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
              >
                <span>Read detailed architecture in the Security Center</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
