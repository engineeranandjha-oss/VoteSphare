'use client';

export default function PositionResultCard({ position }) {
  const {
    positionName,
    positionDescription,
    totalVotes = 0,
    status = 'decided',
    seatsAvailable = 1,
    winners = [],
    isTie = false,
    tiedCandidates = [],
    marginVotes = 0,
    marginPercentage = 0,
    requiresRunoff = false,
    candidates = [],
  } = position;

  const winnerIds = new Set(winners.map((w) => w.id));
  const tiedIds = new Set(tiedCandidates.map((t) => t.id));

  // Determine badge styling based on victory status
  function renderStatusBadge() {
    if (status === 'decided') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span>🏆</span> Decided
        </span>
      );
    }
    if (status === 'uncontested') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span>✓</span> Uncontested
        </span>
      );
    }
    if (isTie || status === 'tie') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
          <span>⚡</span> Exact Tie
        </span>
      );
    }
    if (status === 'no_majority' || requiresRunoff) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <span>⚠️</span> Runoff Required
        </span>
      );
    }
    if (status === 'no_votes') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          No Votes
        </span>
      );
    }
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md transition-all hover:border-slate-700/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-xl font-bold text-white tracking-wide">{positionName}</h3>
            {seatsAvailable > 1 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {seatsAvailable} Seats Available
              </span>
            )}
            {renderStatusBadge()}
          </div>
          {positionDescription && (
            <p className="text-sm text-slate-400 mt-1">{positionDescription}</p>
          )}
        </div>

        <div className="text-left sm:text-right">
          <div className="text-sm font-semibold text-slate-300">
            {totalVotes.toLocaleString()} <span className="text-xs text-slate-500 font-normal">total votes</span>
          </div>
          {status === 'decided' && marginVotes > 0 && (
            <div className="text-xs font-medium text-emerald-400 mt-0.5">
              +{marginVotes} vote margin ({marginPercentage}%)
            </div>
          )}
        </div>
      </div>

      {/* Tie / Runoff Alert Banner */}
      {requiresRunoff && (
        <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div className="text-xs text-amber-200">
            <strong className="font-semibold">Runoff resolution required:</strong> Top candidates
            are deadlocked or did not reach the threshold. Further administrative resolution is needed.
          </div>
        </div>
      )}

      {/* Candidate List */}
      <div className="mt-5 space-y-4">
        {candidates.map((candidate, idx) => {
          const isWinner = winnerIds.has(candidate.id) || candidate.isWinner;
          const isTied = tiedIds.has(candidate.id);
          const votePercentage = candidate.percentage || 0;

          return (
            <div
              key={candidate.id || idx}
              className={`p-4 rounded-xl border transition-all ${
                isWinner
                  ? 'bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : isTied
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-2.5">
                {/* Candidate Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {candidate.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={candidate.photo}
                      alt={candidate.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isWinner
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {candidate.name?.slice(0, 2).toUpperCase() || 'C'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base truncate">
                        {candidate.name}
                      </span>
                      {isWinner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-sm shrink-0">
                          🏆 Winner
                        </span>
                      )}
                      {isTied && !isWinner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          ⚡ Tied
                        </span>
                      )}
                    </div>
                    {candidate.bio && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{candidate.bio}</p>
                    )}
                  </div>
                </div>

                {/* Vote Numbers */}
                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-white">
                    {votePercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {candidate.voteCount || 0} votes
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isWinner
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                      : isTied
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, votePercentage)}%` }}
                />
              </div>
            </div>
          );
        })}

        {candidates.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No candidates registered for this position.
          </div>
        )}
      </div>
    </div>
  );
}
