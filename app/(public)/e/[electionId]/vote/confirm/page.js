'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SessionTimer from '@/components/voting/SessionTimer';
import BallotReviewSummary from '@/components/voting/BallotReviewSummary';
import VoteSuccessReceipt from '@/components/voting/VoteSuccessReceipt';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';

export default function VoteConfirmPage({ params }) {
  const { electionId } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const loadConfirmationPreview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSessionExpired(false);

      if (typeof window === 'undefined') return;

      // 1. Retrieve session & ballot data
      let storedSelections = [];
      let token = '';
      let expiry = null;

      const confirmPayloadStr = sessionStorage.getItem(`vs_confirm_${electionId}`);
      if (confirmPayloadStr) {
        try {
          const payload = JSON.parse(confirmPayloadStr);
          storedSelections = payload.selections || [];
          token = payload.sessionToken || '';
          expiry = payload.expiresAt || null;
        } catch {
          // ignore error
        }
      }

      // Fallback to direct ballot storage
      if (storedSelections.length === 0) {
        const rawBallotStr = sessionStorage.getItem(`vs_ballot_${electionId}`);
        if (rawBallotStr) {
          try {
            const rawBallot = JSON.parse(rawBallotStr);
            Object.entries(rawBallot).forEach(([positionId, cIds]) => {
              (cIds || []).forEach((candidateId) => {
                storedSelections.push({ positionId, candidateId });
              });
            });
          } catch {
            // ignore error
          }
        }
      }

      if (storedSelections.length === 0) {
        setError('No ballot selections found. Please return to the voting booth to choose candidates.');
        setLoading(false);
        return;
      }

      setSessionToken(token);
      setExpiresAt(expiry);

      // 2. Server-side validation via confirm endpoint
      const res = await fetch(`/api/elections/${electionId}/vote/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          selections: storedSelections,
          isAnonymous: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to verify ballot selections on server');
      }

      setPreviewData(json.data);
    } catch (err) {
      setError(err.message || 'An error occurred while preparing your ballot confirmation.');
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    loadConfirmationPreview();
  }, [loadConfirmationPreview]);

  // Handle final vote submission
  async function handleConfirmVote() {
    try {
      setSubmitting(true);
      setError(null);

      if (typeof window === 'undefined') return;

      let storedSelections = [];
      let token = sessionToken;

      const confirmPayloadStr = sessionStorage.getItem(`vs_confirm_${electionId}`);
      if (confirmPayloadStr) {
        try {
          const payload = JSON.parse(confirmPayloadStr);
          storedSelections = payload.selections || [];
          token = payload.sessionToken || token;
        } catch {
          // ignore error
        }
      }

      if (storedSelections.length === 0 && previewData?.ballotPreview) {
        storedSelections = previewData.ballotPreview.map((item) => ({
          positionId: item.positionId,
          candidateId: item.candidateId,
        }));
      }

      const res = await fetch(`/api/elections/${electionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          selections: storedSelections,
          isAnonymous: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to cast ballot');
      }

      // Clear ballot session storage upon successful casting
      sessionStorage.removeItem(`vs_confirm_${electionId}`);
      sessionStorage.removeItem(`vs_ballot_${electionId}`);
      sessionStorage.removeItem(`votesphere_ballot_${electionId}`);
      sessionStorage.removeItem(`votesphere_token_${electionId}`);

      setReceipt(json.data);
    } catch (err) {
      setError(err.message || 'Failed to cast ballot');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSessionExpire() {
    setSessionExpired(true);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 animate-spin">
            <Loader2 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white mb-1">Verifying Ballot Integrity</h2>
            <p className="text-xs text-slate-400">
              Validating candidate choices and verifying cryptographic session...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Success State: Render Receipt Component
  if (receipt) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-12">
        <VoteSuccessReceipt receipt={receipt} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link
            href={`/e/${electionId}/vote`}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Edit Choices</span>
          </Link>

          <div className="flex items-center gap-3">
            {expiresAt && (
              <SessionTimer
                expiresAt={expiresAt}
                onExpire={handleSessionExpire}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Step Indicator & Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Final Step 2 of 2
            </span>
            <span className="text-xs text-slate-400">Pre-Cast Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Review & Confirm Your Ballot
          </h1>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Please carefully review your choices below. Once cast, your vote is sealed and cannot be modified.
          </p>
        </div>

        {/* Error / Session Expiry Alerts */}
        {sessionExpired && (
          <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <div className="text-xs">
                <strong className="font-bold">Session Expired: </strong>
                Your 15-minute privacy token has elapsed. Please return to restart the session.
              </div>
            </div>
            <button
              onClick={() => router.push(`/e/${electionId}/vote`)}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0"
            >
              Restart
            </button>
          </div>
        )}

        {error && !sessionExpired && (
          <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <div className="text-xs">
                <strong className="font-bold">Error: </strong>
                {error}
              </div>
            </div>
            <button
              onClick={loadConfirmationPreview}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shrink-0"
              title="Retry"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Ballot Review Summary Section */}
        {previewData && (
          <BallotReviewSummary
            previewData={previewData}
            electionId={electionId}
          />
        )}

        {/* Bottom Submission Action Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <Link
            href={`/e/${electionId}/vote`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all text-center"
          >
            ← Change Selections
          </Link>

          <button
            type="button"
            onClick={handleConfirmVote}
            disabled={submitting || sessionExpired || !previewData?.valid}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sealing Anonymous Ballot...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Confirm & Cast Ballot 🗳️</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
