'use client';

import CandidateCard from '../candidates/CandidateCard';
import { Award, CheckCircle2, RotateCcw } from 'lucide-react';

export default function BallotPositionSection({
  position,
  selectedCandidateIds = [],
  onToggleCandidate,
  onClearPosition,
  index = 0,
}) {
  const maxChoices = position.maxChoices || 1;
  const isMultiSeat = maxChoices > 1;
  const currentCount = selectedCandidateIds.length;
  const isComplete = currentCount > 0;

  function handleSelect(candidateId) {
    onToggleCandidate(position.id, candidateId, maxChoices);
  }

  return (
    <div
      id={`position-${position.id}`}
      className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${
        isComplete
          ? 'bg-slate-900/80 border-slate-800 ring-1 ring-blue-500/20'
          : 'bg-slate-900/60 border-slate-800/80'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-lg ${
              isComplete
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {index + 1}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white tracking-tight">{position.title}</h3>
              {isMultiSeat ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Choose up to {maxChoices}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Single Choice
                </span>
              )}
            </div>
            {position.description && (
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{position.description}</p>
            )}
          </div>
        </div>

        {/* Selection Status Counter & Reset */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              currentCount === maxChoices
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : currentCount > 0
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
            }`}
          >
            {isComplete && <CheckCircle2 className="h-3.5 w-3.5" />}
            <span>
              {currentCount} of {maxChoices} selected
            </span>
          </div>

          {currentCount > 0 && (
            <button
              type="button"
              onClick={() => onClearPosition(position.id)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
              title="Clear selection"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Candidates List */}
      <div className="mt-6">
        {position.candidates && position.candidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {position.candidates.map((candidate) => {
              const isSelected = selectedCandidateIds.includes(candidate.id);
              return (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={isSelected}
                  isSelectable={true}
                  isMultiSeat={isMultiSeat}
                  onSelect={() => handleSelect(candidate.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <Award className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">No candidates registered for this position.</p>
          </div>
        )}
      </div>
    </div>
  );
}
