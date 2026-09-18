import {
  Shield,
  Zap,
  Building2,
  FileCheck,
  BarChart3,
  Lock,
} from 'lucide-react';

export default function FeatureGrid() {
  const features = [
    {
      icon: Lock,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      title: 'True Ballot Anonymity',
      description:
        'Voter identities are completely decoupled from ballots at the database level. No administrator or auditor can ever reconstruct individual voting choices.',
    },
    {
      icon: Zap,
      color: 'from-amber-400 to-orange-500',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      title: 'Multi-Rule Electoral Engine',
      description:
        'Execute Plurality (FPTP), 50%+1 Absolute Majority, Supermajority Thresholds (e.g. 60%), and Multi-Seat Top-N elections with automated victory margin analysis.',
    },
    {
      icon: Building2,
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      title: 'Multi-Tenant Organizations',
      description:
        'Create isolated organizational workspaces for schools, universities, clubs, or enterprises with custom slugs, invitations, and role-based access control (RBAC).',
    },
    {
      icon: FileCheck,
      color: 'from-emerald-400 to-teal-500',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      title: 'Cryptographic Audit Receipts',
      description:
        'Electors receive unique SHA-256 blind receipts upon casting, enabling independent mathematical verification of ballot inclusion without compromising secrecy.',
    },
    {
      icon: BarChart3,
      color: 'from-cyan-400 to-blue-500',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      title: 'Real-Time Turnout & Quorum',
      description:
        'Live participation gauges track registered vs. cast ballots and monitor quorum thresholds, while strictly shielding candidate choices until official certification.',
    },
    {
      icon: Shield,
      color: 'from-rose-400 to-red-500',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      title: '3-Tier Duplicate Vote Defense',
      description:
        'Layered protection combining cryptographic HMAC tokens, MySQL row-level ACID transaction locking, and composite unique database constraints.',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-blue-400 uppercase tracking-wider">
            Engineered For Integrity
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Everything You Need for Legitimate Elections
          </h2>
          <p className="text-base text-slate-400 leading-relaxed font-normal">
            VoteSphere combines state-of-the-art cryptography, intuitive election configuration, and
            transparent certification tools into one unified platform.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-slate-700 hover:bg-slate-900 hover:-translate-y-1"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${feat.bgColor} ${feat.textColor} border ${feat.borderColor} shadow-inner transition-transform group-hover:scale-110`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
