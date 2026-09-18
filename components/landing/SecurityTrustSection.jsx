import { ShieldCheck, Lock, Database, RefreshCw, KeyRound, FileCheck2 } from 'lucide-react';

export default function SecurityTrustSection() {
  const securityGuarantees = [
    {
      icon: Lock,
      title: 'Zero Voter-Ballot Correlation',
      detail:
        'The Vote database table contains no userId or personal attributes. Once a ballot is cast, it is physically impossible to link candidate choices back to the voter.',
    },
    {
      icon: KeyRound,
      title: 'Cryptographic Token Signing',
      detail:
        'Voting sessions are authenticated via HMAC-SHA256 signed tokens with a 15-minute TTL, defending against tampering and request forgery.',
    },
    {
      icon: Database,
      title: 'ACID Transaction Row Locks',
      detail:
        'MySQL row-level locking (SELECT ... FOR UPDATE) inside atomic ACID transactions completely eliminates concurrency races and double-voting attempts.',
    },
    {
      icon: FileCheck2,
      title: 'Verifiable SHA-256 Blind Receipts',
      detail:
        'Electors receive a deterministic cryptographic hash confirming their ballot was committed, providing auditability without exposing ballot selections.',
    },
    {
      icon: RefreshCw,
      title: 'Replay Attack Protection',
      detail:
        'Every session token is strictly single-use and immediately consumed upon ballot submission, preventing replay across multiple devices or networks.',
    },
    {
      icon: ShieldCheck,
      title: 'Multi-Tenant RBAC Isolation',
      detail:
        'Full tenant isolation ensures organization members, candidates, and election records are strictly segregated across organizations and roles.',
    },
  ];

  return (
    <section id="security" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="max-w-3xl mb-12 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                Security Architecture
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Built on Uncompromising Cryptographic Guarantees
              </h2>
              <p className="text-base text-slate-400 leading-relaxed font-normal">
                Trust in elections requires verifiable math, not just promises. VoteSphere is built from the ground up to guarantee both total secrecy and complete auditability.
              </p>
            </div>

            {/* Guarantees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityGuarantees.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:bg-slate-800/70 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4">
                      <IconComp className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
