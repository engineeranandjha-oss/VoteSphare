'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function EligibilityBanner({ electionId, electionStatus }) {
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    async function checkEligibility() {
      try {
        setLoading(true);
        const res = await fetch(`/api/elections/${electionId}/check-eligibility`);
        const json = await res.json();

        if (res.status === 401) {
          // Unauthenticated
          setEligibility({ unauthenticated: true });
          return;
        }

        if (!res.ok) {
          setEligibility({ eligible: false, code: json.error?.code || 'ERROR', message: json.message });
          return;
        }

        setEligibility(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    checkEligibility();
  }, [electionId]);

  if (loading) {
    return (
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span>Verifying voting credentials & eligibility...</span>
      </div>
    );
  }

  // 1. Unauthenticated State
  if (eligibility?.unauthenticated) {
    return (
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sign In to Vote</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Please sign in with your organization account to verify your voter eligibility.
            </p>
          </div>
        </div>

        <Link
          href={`/auth/login?redirect=/e/${electionId}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 transition-all shrink-0"
        >
          Sign In <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // 2. Already Voted State
  if (eligibility?.code === 'ALREADY_VOTED' || eligibility?.status === 'voted') {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Your Ballot Has Been Sealed</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Confirmed
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              You have successfully participated in this election. Your choices remain strictly anonymous.
            </p>
          </div>
        </div>

        <Link
          href={`/e/${electionId}/results`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white border border-slate-700 transition-all shrink-0"
        >
          View Results / Turnout →
        </Link>
      </div>
    );
  }

  // 3. Eligible & Election Live -> Prominent Vote Now CTA
  if (eligibility?.eligible && electionStatus === 'live') {
    return (
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 animate-pulse">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">You Are Eligible to Vote!</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified Elector
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
              Polls are open. Your identity will be cryptographically detached upon ballot confirmation.
            </p>
          </div>
        </div>

        <Link
          href={`/e/${electionId}/vote`}
          className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 font-black text-sm text-white shadow-xl shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 shrink-0"
        >
          Enter Voting Booth 🗳️
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // 4. Eligible but Scheduled / Not Yet Live
  if (eligibility?.eligible && electionStatus === 'scheduled') {
    return (
      <div className="p-5 rounded-3xl bg-slate-900 border border-indigo-500/20 flex items-center gap-3 text-xs text-indigo-300">
        <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0" />
        <div>
          <strong className="font-semibold text-white">You are registered as an eligible elector.</strong>{' '}
          Voting will open automatically when the scheduled start time arrives.
        </div>
      </div>
    );
  }

  // 5. Ineligible / Disqualified
  if (eligibility && !eligibility.eligible) {
    return (
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
        <AlertCircle className="h-5 w-5 text-slate-500 shrink-0" />
        <div>
          <span className="font-semibold text-slate-300">Voter Eligibility Status: </span>
          {eligibility.message || 'You are not enrolled on the active voter roster for this election.'}
        </div>
      </div>
    );
  }

  return null;
}
