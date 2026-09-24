'use client';

import { useState } from 'react';
import CandidateDetailModal from './CandidateDetailModal';
import { Check, FileText } from 'lucide-react';

export default function CandidateCard({
  candidate,
  isSelected = false,
  onSelect,
  isSelectable = false,
  isMultiSeat = false,
}) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleCardClick() {
    if (isSelectable && onSelect) {
      onSelect(candidate.id);
    }
  }

  return (
    <>
      <div
        onClick={isSelectable ? handleCardClick : undefined}
        className={`group relative p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
          isSelectable ? 'cursor-pointer select-none' : ''
        } ${
          isSelected
            ? 'bg-blue-600/15 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/30'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900 shadow-lg'
        }`}
      >
        <div>
          {/* Top Row: Avatar & Selection Indicator */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              {candidate.photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={candidate.photo}
                  alt={candidate.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md shrink-0"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {candidate.name?.slice(0, 2).toUpperCase() || 'CA'}
                </div>
              )}

              <div className="min-w-0">
                <h4 className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                  {candidate.name}
                </h4>
                {candidate.bio && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">{candidate.bio}</p>
                )}
              </div>
            </div>

            {/* Selection Checkbox / Radio Circle */}
            {isSelectable && (
              <div
                className={`w-6 h-6 rounded-${
                  isMultiSeat ? 'lg' : 'full'
                } border flex items-center justify-center transition-all shrink-0 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/30'
                    : 'border-slate-700 bg-slate-800/80'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            )}
          </div>

          {/* Manifesto Preview Snippet */}
          {candidate.manifesto && (
            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-normal bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 mb-4">
              {candidate.manifesto}
            </p>
          )}
        </div>

        {/* Footer: Read Manifesto Action */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Read Manifesto</span>
          </button>

          {isSelectable && (
            <span className="text-[11px] font-semibold text-slate-500">
              {isSelected ? 'Selected' : 'Click to select'}
            </span>
          )}
        </div>
      </div>

      {/* Candidate Manifesto Detail Modal */}
      <CandidateDetailModal
        candidate={candidate}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isSelected={isSelected}
        onToggleSelect={onSelect}
        isSelectable={isSelectable}
      />
    </>
  );
}
