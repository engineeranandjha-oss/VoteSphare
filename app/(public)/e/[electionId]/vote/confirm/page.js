'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VoteConfirmPage({ params }) {
  const { electionId } = params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadConfirmation() {
      try {
        setLoading(true);
        // Load draft selections from sessionStorage or session
        const storedSelections = sessionStorage.getItem(`votesphere_ballot_${electionId}`);
        const parsedSelections = storedSelections ? JSON.parse(storedSelections) : [];

        if (parsedSelections.length === 0) {
          setError('No ballot selections found. Please return to the ballot to choose candidates.');
          setLoading(false);
          return;
        }

        const storedToken = sessionStorage.getItem(`votesphere_token_${electionId}`) || '';

        const res = await fetch(`/api/elections/${electionId}/vote/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: storedToken,
            selections: parsedSelections,
            isAnonymous: true,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Failed to verify ballot selections');
        }

        setPreviewData(json.data);
      } catch (err) {
        setError(err.message || 'An error occurred while loading ballot confirmation');
      } finally {
        setLoading(false);
      }
    }

    loadConfirmation();
  }, [electionId]);

  async function handleConfirmVote() {
    try {
      setSubmitting(true);
      setError(null);

      const storedSelections = sessionStorage.getItem(`votesphere_ballot_${electionId}`);
      const parsedSelections = storedSelections ? JSON.parse(storedSelections) : [];
      const storedToken = sessionStorage.getItem(`votesphere_token_${electionId}`) || '';

      const res = await fetch(`/api/elections/${electionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: storedToken,
          selections: parsedSelections,
          isAnonymous: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit vote');
      }

      // Clear session ballot
      sessionStorage.removeItem(`votesphere_ballot_${electionId}`);
      sessionStorage.removeItem(`votesphere_token_${electionId}`);

      setReceipt(json.data);
    } catch (err) {
      setError(err.message || 'Failed to cast ballot');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyReceipt() {
    if (receipt?.receiptId) {
      navigator.clipboard.writeText(receipt.receiptId);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Verifying ballot integrity...</p>
        </div>
      </div>
    );
  }

  if (receipt) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-12">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ballot Successfully Cast!
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Your vote has been recorded anonymously and securely for{' '}
              <span className="text-indigo-400 font-semibold">{receipt.electionTitle}</span>.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 text-left space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-semibold">
              <span>Cryptographic Receipt</span>
              <span>Anonymous • Verified</span>
            </div>
            <div className="font-mono text-lg sm:text-xl font-bold text-emerald-400 break-all select-all">
              {receipt.receiptId}
            </div>
            <div className="text-xs text-slate-500 flex justify-between pt-2 border-t border-slate-800/50">
              <span>Positions Voted: {receipt.positionsVotedCount}</span>
              <span>{new Date(receipt.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleCopyReceipt}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition border border-slate-700/50 flex items-center justify-center space-x-2"
            >
              <span>{copied ? '✓ Copied to Clipboard' : '📋 Copy Receipt Code'}</span>
            </button>
            <Link
              href="/"
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 py-12 flex justify-center">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <Link
            href={`/e/${electionId}`}
            className="inline-flex items-center text-sm text-slate-400 hover:text-white transition mb-4 space-x-1"
          >
            <span>←</span>
            <span>Back to Ballot Selection</span>
          </Link>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Step 2 of 2: Final Confirmation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Review & Confirm Your Ballot
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Please verify your candidate choices before submitting. Ballots are anonymous and cannot be changed once cast.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm flex items-start space-x-3">
            <span className="text-base font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {previewData?.warnings?.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-sm space-y-1">
            <div className="font-semibold flex items-center space-x-1">
              <span>⚠️ Notice</span>
            </div>
            {previewData.warnings.map((w, idx) => (
              <p key={idx} className="text-xs text-amber-200/80">
                {w}
              </p>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Selected Candidates ({previewData?.selectedCount || 0} of {previewData?.totalPositionsCount || 0} Positions)
          </h2>

          <div className="space-y-3">
            {previewData?.ballotPreview?.map((item) => (
              <div
                key={item.positionId}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-4">
                  {item.candidatePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.candidatePhoto}
                      alt={item.candidateName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base font-bold text-indigo-400">
                      {item.candidateName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      {item.positionName}
                    </span>
                    <h3 className="text-base font-bold text-white">{item.candidateName}</h3>
                    {item.candidateBio && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {item.candidateBio}
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/e/${electionId}`}
            className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl transition text-center flex-1"
          >
            Modify Choices
          </Link>
          <button
            onClick={handleConfirmVote}
            disabled={submitting || (previewData?.ballotPreview?.length || 0) === 0}
            className="py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Casting Secure Ballot...</span>
              </>
            ) : (
              <span>🔒 Confirm & Cast Ballot</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
