'use client';

import { Layers } from 'lucide-react';
import CandidateGrid from '@/components/candidates/CandidateGrid';

export default function PositionPreviewList({ positions = [] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Contested Positions</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review the positions, available seats, and nominated candidate profiles.
          </p>
        </div>
        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
          {positions.length} {positions.length === 1 ? 'Position' : 'Positions'}
        </span>
      </div>

      <div className="space-y-6">
        {positions.map((pos) => {
          const candidates = pos.candidates || [];
          const seats = pos.maxSelections || 1;

          return (
            <div
              key={pos.id}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md"
            >
              {/* Position Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800 mb-5">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-bold text-white tracking-tight">{pos.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {seats} {seats > 1 ? 'Seats Available' : 'Seat Available'}
                    </span>
                  </div>
                  {pos.description && (
                    <p className="text-xs text-slate-400 mt-1">{pos.description}</p>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  <span>
                    {candidates.length} {candidates.length === 1 ? 'Candidate' : 'Candidates'}
                  </span>
                </div>
              </div>

              {/* Candidates Grid with interactive modal support */}
              <CandidateGrid
                candidates={candidates}
                isSelectable={false}
                maxSelections={seats}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

