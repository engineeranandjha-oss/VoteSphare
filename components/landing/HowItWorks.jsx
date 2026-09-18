export default function HowItWorks() {
  const steps = [
    {
      stepNumber: '01',
      title: 'Create Organization & Ballots',
      description:
        'Set up your organization workspace, configure positions, set winning thresholds, and add candidate profiles with bios, manifestos, and photos.',
      accent: 'from-blue-500 to-indigo-500',
    },
    {
      stepNumber: '02',
      title: 'Enroll Electors & Issue Tokens',
      description:
        'Assign voter eligibility across organization members, issue cryptographically signed invitation links, and set automatic voting schedules.',
      accent: 'from-indigo-500 to-purple-500',
    },
    {
      stepNumber: '03',
      title: 'Cast Sealed Anonymous Votes',
      description:
        'Electors vote with total confidence. Identities are decoupled in memory, ballots are committed via ACID transactions, and voters receive instant SHA-256 receipts.',
      accent: 'from-purple-500 to-pink-500',
    },
    {
      stepNumber: '04',
      title: 'Certify & Publish Official Results',
      description:
        'When voting concludes, the system determines winners, analyzes victory margins, seals an immutable certified snapshot, and broadcasts results to members.',
      accent: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-slate-900/40 border-y border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Simple 4-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How VoteSphere Works
          </h2>
          <p className="text-base text-slate-400 leading-relaxed font-normal">
            From ballot preparation to certified outcomes, VoteSphere streamlines the entire election lifecycle.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-xl backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div
                  className={`text-3xl font-black bg-gradient-to-r ${step.accent} bg-clip-text text-transparent mb-4 font-mono`}
                >
                  {step.stepNumber}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Phase {step.stepNumber}</span>
                <span>•</span>
                <span>Automated Workflow</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
