import Link from 'next/link';
import {
  ShieldCheck,
  EyeOff,
  KeyRound,
  FileText,
  Server,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function SecurityTrustSection() {
  const securityPillars = [
    {
      icon: EyeOff,
      title: 'Ballot Privacy',
      detail:
        'Keep voter identity and ballot information appropriately separated within the voting workflow.',
    },
    {
      icon: KeyRound,
      title: 'Cryptographic Verification',
      detail:
        'Verify election participation through cryptographic receipt information.',
    },
    {
      icon: FileText,
      title: 'Tamper-Evident Records',
      detail:
        'Use cryptographic verification mechanisms to help detect changes to election records.',
    },
    {
      icon: Server,
      title: 'Secure Voting Sessions',
      detail:
        'Control voter access and enforce the configured voting rules for each election.',
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
                Security Built Into Every Election
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
                VoteSphere is designed to protect voter privacy, ballot integrity, and the verifiability of election results.
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

            {/* Guarantees Grid (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {securityPillars.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3">
                        <IconComp className="h-4.5 w-4.5" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-normal">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Verification & Architecture Links */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  <span>Verify Your Election Record</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Use your verification information to confirm that your election participation was recorded by VoteSphere.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600/15 border border-cyan-500/30 text-xs font-bold text-cyan-300 hover:bg-cyan-600/25 transition-all"
                >
                  <span>Verify a Receipt</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/security"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline px-2 py-1"
                >
                  <span>Security Center</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
