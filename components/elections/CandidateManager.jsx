'use client';

import { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';

export default function CandidateManager({
  positions = [],
  candidates = [],
  onChange,
}) {
  const [selectedPosTempId, setSelectedPosTempId] = useState(
    positions[0]?.tempId || ''
  );
  const [candName, setCandName] = useState('');
  const [candBio, setCandBio] = useState('');
  const [candPhoto, setCandPhoto] = useState('');
  const [candManifesto, setCandManifesto] = useState('');
  const [error, setError] = useState(null);

  // Sync default selected position if empty
  if (!selectedPosTempId && positions.length > 0) {
    setSelectedPosTempId(positions[0].tempId);
  }

  function handleAddCandidate() {
    setError(null);
    const name = candName.trim();
    if (!name) {
      setError('Candidate name is required.');
      return;
    }

    if (!selectedPosTempId) {
      setError('Please select a position for this candidate.');
      return;
    }

    const pos = positions.find((p) => p.tempId === selectedPosTempId);

    const newCandidate = {
      tempId: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      positionTempId: selectedPosTempId,
      positionName: pos?.name || 'Position',
      name,
      bio: candBio.trim() || null,
      photo: candPhoto.trim() || null,
      manifesto: candManifesto.trim() || null,
    };

    onChange([...candidates, newCandidate]);
    setCandName('');
    setCandBio('');
    setCandPhoto('');
    setCandManifesto('');
  }

  function handleRemoveCandidate(tempId) {
    onChange(candidates.filter((c) => c.tempId !== tempId));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Add Candidates</h3>
        <p className="text-xs text-slate-400 mt-1">
          Nominate and assign candidate profiles to your configured positions.
        </p>
      </div>

      {/* Add Candidate Form */}
      <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-emerald-400" />
          Nominate Candidate
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Position <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedPosTempId}
              onChange={(e) => setSelectedPosTempId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {positions.map((pos) => (
                <option key={pos.tempId} value={pos.tempId}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-7">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Candidate Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={candName}
              onChange={(e) => setCandName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          <ImageUpload
            label="Candidate Photo / Headshot"
            value={candPhoto}
            onChange={(val) => setCandPhoto(val || '')}
            aspectRatio="avatar"
            helperText="Upload candidate headshot (PNG, JPG, WEBP)"
          />

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Short Bio / Tagline <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={candBio}
              onChange={(e) => setCandBio(e.target.value)}
              placeholder="e.g. 3rd-year CS major"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Manifesto / Platform Summary <span className="text-slate-500">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={candManifesto}
            onChange={(e) => setCandManifesto(e.target.value)}
            placeholder="Key initiatives and campaign goals..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <button
          type="button"
          onClick={handleAddCandidate}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
        >
          <Plus className="h-4 w-4" /> Add Candidate
        </button>
      </div>

      {/* Candidate Roster Grouped by Position */}
      <div className="space-y-4">
        {positions.map((pos) => {
          const posCandidates = candidates.filter(
            (c) => c.positionTempId === pos.tempId
          );

          return (
            <div
              key={pos.tempId}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  {pos.name}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {posCandidates.length} Candidates
                </span>
              </div>

              <div className="space-y-2">
                {posCandidates.map((cand) => (
                  <div
                    key={cand.tempId}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {cand.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {cand.name}
                        </div>
                        {cand.bio && (
                          <div className="text-xs text-slate-400 truncate">
                            {cand.bio}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCandidate(cand.tempId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Remove Candidate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {posCandidates.length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    No candidates nominated for this position yet.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
