'use client';

import Link from 'next/link';
import { Check, AlertCircle, Edit3, ShieldCheck } from 'lucide-react';

export default function BallotReviewSummary({
  previewData,
  electionId,
}) {
  const {
    ballotPreview = [],
    totalPositionsCount = 0,
    selectedCount = 0,
    unselectedPositions = [],
    warnings = [],
  } = previewData || {};

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Reminder */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Cryptographic Privacy Protection</h4>
            <p className="text-[11px] text-slate-400">
              Your identity is stripped at the database level upon confirmation.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
          {selectedCount} of {totalPositionsCount} Voted
        </span>
      </div>

      {/* Warnings & Unselected Notices */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span>Incomplete Ballot Notice</span>
          </div>
          {warnings.map((w, idx) => (
            <p key={idx} className="text-amber-200/90 leading-relaxed pl-5">
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* Selected Choices List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Your Choices ({selectedCount})
        </h3>

        {ballotPreview.length > 0 ? (
          ballotPreview.map((item) => (
            <div
              key={`${item.positionId}-${item.candidateId}`}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700/80 transition-all shadow-md"
            >
              <div className="flex items-center gap-4 min-w-0">
                {item.candidatePhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.candidatePhoto}
                    alt={item.candidateName}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm shrink-0">
                    {item.candidateName?.slice(0, 2).toUpperCase() || 'CA'}
                  </div>
                )}

                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block truncate">
                    {item.positionName}
                  </span>
                  <h4 className="text-base font-bold text-white truncate">{item.candidateName}</h4>
                  {item.candidateBio && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.candidateBio}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/e/${electionId}/vote#position-${item.positionId}`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
                  title="Change choice"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Link>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shadow-sm">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
            No candidate selections recorded.
          </div>
        )}
      </div>

      {/* Unselected / Blank Positions */}
      {unselectedPositions.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Unselected Positions / Abstained ({unselectedPositions.length})
          </h3>

          {unselectedPositions.map((pos) => (
            <div
              key={pos.positionId}
              className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-4 text-xs"
            >
              <div>
                <span className="font-semibold text-slate-300">{pos.positionName}</span>
                <span className="text-slate-500 block text-[11px]">No candidate chosen (Blank vote)</span>
              </div>

              <Link
                href={`/e/${electionId}/vote#position-${pos.positionId}`}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-bold text-xs border border-slate-700 transition-colors"
              >
                Select Candidate
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
