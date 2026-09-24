'use client';

import CandidateCard from './CandidateCard';

export default function CandidateGrid({
  candidates = [],
  selectedIds = [],
  onToggleCandidate,
  isSelectable = false,
  maxSelections = 1,
}) {
  const isMultiSeat = maxSelections > 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {candidates.map((candidate) => {
        const isSelected = selectedIds.includes(candidate.id);

        return (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            isSelected={isSelected}
            onSelect={onToggleCandidate}
            isSelectable={isSelectable}
            isMultiSeat={isMultiSeat}
          />
        );
      })}

      {candidates.length === 0 && (
        <div className="col-span-full py-8 text-center text-xs text-slate-500 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
          No candidates registered for this position.
        </div>
      )}
    </div>
  );
}
