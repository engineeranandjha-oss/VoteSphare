'use client';

export default function TurnoutWidget({ turnout, quorum, isLive = false }) {
  const turnoutPercentage = turnout?.turnoutPercentage || 0;
  const totalEligible = turnout?.totalEligible || 0;
  const totalVoted = turnout?.totalVoted || 0;
  const remainingCount = turnout?.remainingCount ?? Math.max(0, totalEligible - totalVoted);

  const targetPercentage = quorum?.targetPercentage || 0;
  const isQuorumMet = quorum?.isMet ?? (targetPercentage > 0 ? turnoutPercentage >= targetPercentage : true);
  const requiredVotes = quorum?.requiredVotes || Math.ceil((totalEligible * targetPercentage) / 100);
  const deficitVotes = quorum?.deficit || (isQuorumMet ? 0 : Math.max(0, requiredVotes - totalVoted));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {isLive ? 'Live Voter Turnout' : 'Official Voter Turnout'}
            </h3>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Participation metrics and quorum threshold evaluations
          </p>
        </div>

        {/* Turnout Percentage Badge */}
        <div className="flex items-baseline gap-1 self-start sm:self-auto">
          <span className="text-3xl font-extrabold text-blue-400">
            {turnoutPercentage.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400 font-medium">Turnout</span>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="mt-5">
        <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
          <span>{totalVoted} Cast of {totalEligible} Eligible</span>
          <span>{turnoutPercentage}% Participated</span>
        </div>
        <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 relative">
          {/* Quorum Target Marker */}
          {targetPercentage > 0 && targetPercentage <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
              style={{ left: `${targetPercentage}%` }}
              title={`Quorum Target: ${targetPercentage}%`}
            />
          )}
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, turnoutPercentage)}%` }}
          />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 font-medium">Eligible Electors</div>
          <div className="text-xl font-bold text-white mt-1">{totalEligible.toLocaleString()}</div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 font-medium">Ballots Cast</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{totalVoted.toLocaleString()}</div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 font-medium">Remaining</div>
          <div className="text-xl font-bold text-slate-300 mt-1">{remainingCount.toLocaleString()}</div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 font-medium">Quorum Status</div>
          <div className="mt-1">
            {targetPercentage === 0 ? (
              <span className="text-xs font-semibold text-slate-400">No Target Set</span>
            ) : isQuorumMet ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                <span>✓</span> Met ({targetPercentage}%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                <span>!</span> {deficitVotes} needed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
