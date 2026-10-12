'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GitFork,
  X,
  AlertTriangle,
  Loader2,
  Users,
  ShieldCheck,
  Flame,
  ArrowRight,
} from 'lucide-react';
import {
  startGlobalProgress,
  completeGlobalProgress,
} from '@/components/common/GlobalProgressProvider';

export default function RunoffModal({
  isOpen,
  onClose,
  electionId,
  electionTitle,
  round = 1,
  orgId,
  votingRule = 'plurality',
  totalEligibleVoters = 0,
  positionsToRunoff = [],
  onRunoffCreated,
}) {
  const router = useRouter();
  const [startImmediately, setStartImmediately] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const targetRound = round + 1;

  async function handleCreateRunoff() {
    try {
      setLoading(true);
      startGlobalProgress();
      setError(null);

      const res = await fetch(`/api/elections/${electionId}/runoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startImmediately,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to create runoff election');
      }

      if (onRunoffCreated) {
        onRunoffCreated(json.data.runoffElection);
      } else if (orgId && json.data?.runoffElection?.id) {
        router.push(`/org/${orgId}/elections/${json.data.runoffElection.id}`);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while creating runoff.');
    } finally {
      setLoading(false);
      completeGlobalProgress();
    }
  }

  const ruleDisplayMap = {
    plurality: 'Plurality (First-Past-The-Post)',
    absolute_majority: 'Absolute Majority (> 50%)',
    threshold: 'Configurable Supermajority Threshold',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="runoff-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <GitFork className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest mb-1">
                Linked Runoff Engine
              </div>
              <h2 id="runoff-modal-title" className="text-xl font-black text-white tracking-tight">
                Start Runoff Election
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          <p className="text-slate-300 leading-relaxed">
            This election ended without a unique winner. VoteSphere can create a new voting round using the candidates and eligible voters required to resolve the result.
          </p>

          {/* Configuration Review Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Original Election
              </span>
              <span className="text-white font-semibold text-sm truncate block" title={electionTitle}>
                {electionTitle}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Round
              </span>
              <span className="text-purple-300 font-bold text-sm flex items-center gap-1.5">
                <span>Round {round}</span>
                <ArrowRight className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-purple-400">Runoff Round {targetRound}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Eligible Voters
              </span>
              <span className="text-slate-200 font-semibold text-sm flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-400" />
                {totalEligibleVoters.toLocaleString()} voters enrolled
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Voting Rule
              </span>
              <span className="text-slate-200 font-semibold text-sm">
                {ruleDisplayMap[votingRule] || votingRule}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Previous Votes
              </span>
              <span className="text-amber-300 font-semibold text-xs">
                Not carried forward
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                New Round Votes
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                0
              </span>
            </div>
          </div>

          {/* Qualified Runoff Candidates List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                Runoff Candidates (Authoritative Roster)
              </h3>
              <span className="text-[11px] text-slate-400">
                Derived from certified results
              </span>
            </div>

            <div className="space-y-3">
              {positionsToRunoff.map((pos) => (
                <div
                  key={pos.positionId}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">{pos.positionName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {pos.status === 'tie' ? 'Tie Breaker' : 'Majority Runoff'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(pos.runoffCandidates || pos.tiedCandidates || pos.candidates || []).map((cand) => (
                      <div
                        key={cand.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800/80"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-purple-500/30">
                            {cand.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-white truncate text-xs">
                            {cand.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                          {cand.voteCount || 0} votes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Launch Options */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={startImmediately}
                onChange={(e) => setStartImmediately(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500/30 focus:ring-offset-slate-950"
              />
              <div>
                <span className="font-bold text-white text-xs block">
                  Launch Runoff Immediately (Live Status)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Opens voting polls for enrolled electors immediately upon creation. Uncheck to save as Draft.
                </span>
              </div>
            </label>
          </div>

          {/* Immutability Guarantee Notice */}
          <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3 flex items-start gap-2">
            <span className="text-sm">🔒</span>
            <span>
              <strong>Immutability Guarantee:</strong> The original election (Round {round}) remains untouched and permanently certified with all historic vote records, ballots, and turnout metrics intact.
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreateRunoff}
            disabled={loading}
            aria-busy={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating & Launching Runoff...</span>
              </>
            ) : (
              <>
                <Flame className="h-4 w-4 text-amber-300" />
                <span>Create & Launch Runoff</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
