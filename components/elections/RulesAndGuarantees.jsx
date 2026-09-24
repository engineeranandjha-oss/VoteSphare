import { ShieldCheck, Scale, Award, Percent } from 'lucide-react';

export default function RulesAndGuarantees({ config = {} }) {
  const winningRule = config.winningRule || 'plurality';
  const quorumPercentage = config.quorumPercentage || 0;

  function renderRuleText() {
    if (winningRule === 'absolute_majority') {
      return 'Absolute Majority (50% + 1 Vote): A candidate must win more than 50% of the cast votes for a position. If no candidate achieves a majority, a runoff is triggered.';
    }
    if (winningRule === 'threshold') {
      return `Supermajority Threshold (${config.majorityThreshold || 50}%): Winning candidates must achieve at least ${config.majorityThreshold || 50}% of the vote share.`;
    }
    return 'Plurality (First-Past-The-Post): The candidate receiving the highest number of votes wins the position.';
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-white tracking-tight">
          Electoral Rules & Cryptographic Guarantees
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Winning Rule */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Award className="h-4 w-4" /> Winning Rule
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {renderRuleText()}
          </p>
        </div>

        {/* Quorum Target */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Percent className="h-4 w-4" /> Quorum Requirement
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {quorumPercentage > 0
              ? `At least ${quorumPercentage}% of eligible voters must participate for outcomes to be considered valid.`
              : 'No minimum voter turnout quorum is mandated for this election.'}
          </p>
        </div>

        {/* Anonymity Protocol */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Secrecy Guarantee
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Voter identities are completely disconnected from ballots upon submission. No one can ever trace votes back to individuals.
          </p>
        </div>
      </div>
    </div>
  );
}
