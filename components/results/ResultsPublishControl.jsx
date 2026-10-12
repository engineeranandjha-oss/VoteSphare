'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';

export default function ResultsPublishControl({
  electionId,
  status = 'ended',
  isCertified = false,
  certificationDetails = null,
  onStatusChange,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const isPublished = status === 'published' || isCertified;
  const isEnded = status === 'ended';
  const isLive = status === 'live';

  async function handlePublish() {
    try {
      setLoading(true);
      startGlobalProgress();
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/elections/${electionId}/results/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to publish official results');
      }

      setSuccessMsg('Results successfully certified and published to the public!');
      if (onStatusChange) onStatusChange();
    } catch (err) {
      setError(err.message || 'An error occurred during certification.');
    } finally {
      setLoading(false);
      completeGlobalProgress();
    }
  }

  async function handleUnpublish() {
    const confirmed = window.confirm(
      'Are you sure you want to unpublish the official results? Public viewers will no longer see individual candidate tallies until republished.'
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      startGlobalProgress();
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/elections/${electionId}/results/publish`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to unpublish results');
      }

      setSuccessMsg('Results unpublished. Election status reverted to ended.');
      if (onStatusChange) onStatusChange();
    } catch (err) {
      setError(err.message || 'An error occurred while unpublishing.');
    } finally {
      setLoading(false);
      completeGlobalProgress();
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isPublished
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isEnded
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}
          >
            {isPublished ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : isEnded ? (
              <FileCheck className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Results Certification & Publishing</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Control public access to verified candidate vote counts and winner determinations
            </p>
          </div>
        </div>

        {/* Current State Badge */}
        <div>
          {isPublished ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" /> Certified & Published
            </span>
          ) : isEnded ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="h-3.5 w-3.5" /> Ready for Certification
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Lock className="h-3.5 w-3.5" /> Polls Active (Tallies Hidden)
            </span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Certification Metadata */}
      {isPublished && certificationDetails && (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Certified At:</span>
            <strong className="text-slate-200">
              {certificationDetails.certifiedAt
                ? new Date(certificationDetails.certifiedAt).toLocaleString()
                : 'Confirmed'}
            </strong>
          </div>
          {certificationDetails.snapshotHash && (
            <div className="flex justify-between text-slate-400 items-center">
              <span>Cryptographic Snapshot Hash:</span>
              <span className="font-mono text-emerald-400 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {certificationDetails.snapshotHash.substring(0, 16)}...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-400">
          {isPublished
            ? 'Official results are live and viewable by the public.'
            : isEnded
            ? 'Voting has ended. You can now seal the final certified snapshot.'
            : 'Candidate vote totals remain sealed until election polls close.'}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isEnded && !isPublished && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              aria-busy={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Certifying & Publishing...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  <span>Certify & Publish Results</span>
                </>
              )}
            </button>
          )}

          {isPublished && (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={loading}
              aria-busy={loading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Unpublishing Results...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Unpublish Results</span>
                </>
              )}
            </button>
          )}

          {isLive && (
            <div className="text-xs font-medium text-slate-500 italic">
              Awaiting election close to certify
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
