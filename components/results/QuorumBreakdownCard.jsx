'use client';

import { CheckCircle2, AlertTriangle, ShieldAlert, BarChart2 } from 'lucide-react';

export default function QuorumBreakdownCard({ quorum, turnout }) {
  if (!quorum && !turnout) return null;

  const targetPercentage = quorum?.targetPercentage || 0;
  const totalEligible = turnout?.totalEligible || 0;
  const totalVoted = turnout?.totalVoted || 0;
  const turnoutPercentage = turnout?.turnoutPercentage || 0;

  const isQuorumMet =
    quorum?.isMet ?? (targetPercentage > 0 ? turnoutPercentage >= targetPercentage : true);
  const requiredVotes =
    quorum?.requiredVotes || Math.ceil((totalEligible * targetPercentage) / 100);
  const deficitVotes =
    quorum?.deficit || (isQuorumMet ? 0 : Math.max(0, requiredVotes - totalVoted));
  const excessVotes = Math.max(0, totalVoted - requiredVotes);

  const formattedTurnoutPct =
    turnoutPercentage % 1 === 0 ? turnoutPercentage.toFixed(0) : turnoutPercentage.toFixed(1);
  const votesLabel = (count) => (count === 1 ? 'vote' : 'votes');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Participation Requirements</h4>
            <p className="text-[11px] text-slate-400">
              Minimum participation rules and election status
            </p>
          </div>
        </div>

        <div>
          {targetPercentage === 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              No Minimum Vote Requirement
            </span>
          ) : isQuorumMet ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> Minimum Met ({targetPercentage}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5" /> Minimum Not Met
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-slate-400 font-medium">Minimum Votes Needed</span>
          <div className="text-base font-bold text-white mt-0.5">
            {targetPercentage > 0
              ? `${targetPercentage}% (${requiredVotes} ${votesLabel(requiredVotes)})`
              : 'None'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-slate-400 font-medium">People Who Voted</span>
          <div className="text-base font-bold text-blue-400 mt-0.5">
            {formattedTurnoutPct}% ({totalVoted} ${votesLabel(totalVoted)})
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-slate-400 font-medium">Votes Above Minimum</span>
          <div
            className={`text-base font-bold mt-0.5 ${
              isQuorumMet ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isQuorumMet
              ? `+${excessVotes} ${excessVotes === 1 ? 'vote' : 'votes'} above minimum`
              : `-${deficitVotes} ${deficitVotes === 1 ? 'vote' : 'votes'} below minimum`}
          </div>
        </div>
      </div>

      {!isQuorumMet && targetPercentage > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            Election results may be subject to review or re-vote if the {targetPercentage}% minimum participation is legally mandated.
          </span>
        </div>
      )}
    </div>
  );
}
