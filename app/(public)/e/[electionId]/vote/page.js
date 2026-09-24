'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SessionTimer from '@/components/voting/SessionTimer';
import BallotPositionSection from '@/components/voting/BallotPositionSection';
import BallotStickyFooter from '@/components/voting/BallotStickyFooter';
import { Lock, ArrowLeft, Loader2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function VotingInterfacePage({ params }) {
  const { electionId } = params;
  const router = useRouter();

  const [election, setElection] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Election and Start/Resume Voting Session
  const initVotingBooth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSessionExpired(false);

      // 1. Fetch Election Data
      const elecRes = await fetch(`/api/elections/${electionId}`, { cache: 'no-store' });
      const elecJson = await elecRes.json();

      if (!elecRes.ok) {
        throw new Error(elecJson.message || 'Failed to load election details');
      }

      if (elecJson.data.status !== 'live') {
        throw new Error(`Election is currently ${elecJson.data.status}. Voting is only open for live elections.`);
      }

      setElection(elecJson.data);

      // 2. Start / Resume Voting Session
      const sessionRes = await fetch(`/api/elections/${electionId}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const sessionJson = await sessionRes.json();

      if (sessionRes.status === 401) {
        router.push(`/auth/login?redirect=/e/${electionId}/vote`);
        return;
      }

      if (!sessionRes.ok) {
        throw new Error(sessionJson.message || 'Unable to initialize secure voting session');
      }

      setSessionData(sessionJson.data);

      // Check if existing saved ballot selections in sessionStorage
      if (typeof window !== 'undefined') {
        try {
          const savedBallot = sessionStorage.getItem(`vs_ballot_${electionId}`);
          if (savedBallot) {
            setSelections(JSON.parse(savedBallot));
          }
        } catch {
          // Ignore parse errors
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize voting booth');
    } finally {
      setLoading(false);
    }
  }, [electionId, router]);

  useEffect(() => {
    initVotingBooth();
  }, [initVotingBooth]);

  // Handle Candidate Selection
  function handleToggleCandidate(positionId, candidateId, maxChoices = 1) {
    if (sessionExpired) return;

    setSelections((prev) => {
      const currentList = prev[positionId] || [];
      let updatedList;

      if (maxChoices === 1) {
        // Single choice: if clicking already selected candidate, deselect; otherwise replace
        updatedList = currentList.includes(candidateId) ? [] : [candidateId];
      } else {
        // Multi-seat: toggle in/out if under max limit
        if (currentList.includes(candidateId)) {
          updatedList = currentList.filter((id) => id !== candidateId);
        } else {
          if (currentList.length < maxChoices) {
            updatedList = [...currentList, candidateId];
          } else {
            // Already at max limit, replace oldest selection or ignore
            updatedList = [...currentList.slice(1), candidateId];
          }
        }
      }

      const updatedSelections = {
        ...prev,
        [positionId]: updatedList,
      };

      // Persist in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`vs_ballot_${electionId}`, JSON.stringify(updatedSelections));
      }

      return updatedSelections;
    });
  }

  // Handle Position Clear
  function handleClearPosition(positionId) {
    if (sessionExpired) return;

    setSelections((prev) => {
      const updated = { ...prev, [positionId]: [] };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`vs_ballot_${electionId}`, JSON.stringify(updated));
      }
      return updated;
    });
  }

  // Handle Session Expiry
  function handleExpire() {
    setSessionExpired(true);
  }

  // Handle Proceed to Review and Confirmation
  function handleReview() {
    if (sessionExpired || !election) return;
    setIsSubmitting(true);

    try {
      const formattedSelections = [];
      const positions = election.positions || [];

      positions.forEach((pos) => {
        const candidateIds = selections[pos.id] || [];
        candidateIds.forEach((cId) => {
          formattedSelections.push({
            positionId: pos.id,
            candidateId: cId,
          });
        });
      });

      // Save prepared payload for confirmation screen
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `vs_confirm_${electionId}`,
          JSON.stringify({
            electionId,
            sessionToken: sessionData?.token,
            selections: formattedSelections,
            rawSelections: selections,
            expiresAt: sessionData?.expiresAt,
          })
        );
      }

      router.push(`/e/${electionId}/vote/confirm`);
    } catch {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 animate-spin">
            <Loader2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Opening Secure Voting Booth</h2>
            <p className="text-xs text-slate-400">
              Generating ephemeral 15-minute cryptographic session token...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !election) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to Access Voting Booth</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {error || 'This election is not currently open for voting or your session could not be verified.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={initVotingBooth}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
            <Link
              href={`/e/${electionId}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all text-center"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const positions = election.positions || [];
  const completedCount = positions.filter((p) => (selections[p.id] || []).length > 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-36 selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href={`/e/${electionId}`}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Exit Booth</span>
          </Link>

          <div className="flex items-center gap-3">
            {sessionData?.expiresAt && (
              <SessionTimer
                expiresAt={sessionData.expiresAt}
                onExpire={handleExpire}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Session Expired Banner Alert */}
        {sessionExpired && (
          <div className="p-6 rounded-3xl bg-red-950/40 border border-red-500/40 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl animate-shake">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Your Voting Session Has Expired</h4>
                <p className="text-xs text-red-300 mt-0.5">
                  The 15-minute privacy window has elapsed. Please start a new session to cast your ballot.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={initVotingBooth}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Renew Session</span>
            </button>
          </div>
        )}

        {/* Election Header Info */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Official Ballot
              </span>
              <span className="text-xs text-slate-400">
                {positions.length} Contested {positions.length === 1 ? 'Position' : 'Positions'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{election.title}</h1>
            {election.description && (
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">{election.description}</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">100% Anonymous</div>
              <div className="text-[11px] text-slate-400">Choice dissociated on seal</div>
            </div>
          </div>
        </div>

        {/* Instructions Guide */}
        <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3">
          <Lock className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>Voting Instructions:</strong> Select your preferred candidate(s) for each position listed below.
            You may review and adjust your choices at the confirmation screen before final cryptographic sealing.
          </p>
        </div>

        {/* Position Sections */}
        <div className="space-y-6">
          {positions.map((pos, idx) => (
            <BallotPositionSection
              key={pos.id}
              position={pos}
              index={idx}
              selectedCandidateIds={selections[pos.id] || []}
              onToggleCandidate={handleToggleCandidate}
              onClearPosition={handleClearPosition}
            />
          ))}
        </div>
      </main>

      {/* Sticky Bottom Progress Bar & Submission Action */}
      <BallotStickyFooter
        totalPositions={positions.length}
        completedPositions={completedCount}
        onReview={handleReview}
        disabled={sessionExpired || completedCount === 0}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
