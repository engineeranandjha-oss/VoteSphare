'use client';

import { ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export default function BallotStickyFooter({
  totalPositions = 0,
  completedPositions = 0,
  onReview,
  disabled = false,
  isSubmitting = false,
}) {
  const percentage = totalPositions > 0 ? Math.round((completedPositions / totalPositions) * 100) : 0;
  const isAllComplete = totalPositions > 0 && completedPositions === totalPositions;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-slate-950/85 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Progress & Privacy Guarantee */}
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            {isAllComplete ? (
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
            ) : (
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            )}
          </div>

          <div className="flex-1 sm:flex-none">
            <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
              <span className="text-xs sm:text-sm font-bold text-white">
                {completedPositions} of {totalPositions} Completed
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">({percentage}%)</span>
            </div>

            {/* Progress bar */}
            <div className="w-full sm:w-48 h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Anonymity notice & Submit CTA */}
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-300">Cryptographically Dissociated</span>
            <span className="text-[11px] text-slate-500">Your identity cannot be linked to this ballot</span>
          </div>

          <button
            type="button"
            onClick={onReview}
            disabled={disabled || isSubmitting}
            className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>{isSubmitting ? 'Securing Ballot...' : 'Review & Cast Ballot'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
