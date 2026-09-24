'use client';

import { useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';

export default function PositionManager({ positions = [], onChange }) {
  const [newPosName, setNewPosName] = useState('');
  const [newPosDesc, setNewPosDesc] = useState('');
  const [newPosSeats, setNewPosSeats] = useState(1);
  const [error, setError] = useState(null);

  function handleAddPosition() {
    setError(null);
    const name = newPosName.trim();
    if (!name) {
      setError('Position title is required.');
      return;
    }

    if (positions.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError('A position with this name already exists.');
      return;
    }

    const newPosition = {
      tempId: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      description: newPosDesc.trim() || null,
      maxSelections: Math.max(1, parseInt(newPosSeats, 10) || 1),
      order: positions.length + 1,
    };

    onChange([...positions, newPosition]);
    setNewPosName('');
    setNewPosDesc('');
    setNewPosSeats(1);
  }

  function handleRemovePosition(tempId) {
    const updated = positions
      .filter((p) => p.tempId !== tempId)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    onChange(updated);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Configure Electoral Positions</h3>
        <p className="text-xs text-slate-400 mt-1">
          Add the offices or positions to be contested (e.g., President, Vice President, Treasurer, Senator).
        </p>
      </div>

      {/* Add Position Form */}
      <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-blue-400" />
          Add Position
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Position Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={newPosName}
              onChange={(e) => setNewPosName(e.target.value)}
              placeholder="e.g. Student Council President"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Seats Available
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={newPosSeats}
              onChange={(e) => setNewPosSeats(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Description <span className="text-slate-500">(Optional)</span>
          </label>
          <input
            type="text"
            value={newPosDesc}
            onChange={(e) => setNewPosDesc(e.target.value)}
            placeholder="Briefly describe the responsibilities of this position..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <button
          type="button"
          onClick={handleAddPosition}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" /> Add Position
        </button>
      </div>

      {/* Configured Positions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Configured Positions ({positions.length})</span>
        </div>

        {positions.map((pos, idx) => (
          <div
            key={pos.tempId || idx}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                {idx + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">{pos.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {pos.maxSelections} {pos.maxSelections > 1 ? 'Seats' : 'Seat'}
                  </span>
                </div>
                {pos.description && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">{pos.description}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRemovePosition(pos.tempId)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Remove Position"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {positions.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
            No positions added yet. Please add at least one position above to proceed.
          </div>
        )}
      </div>
    </div>
  );
}
