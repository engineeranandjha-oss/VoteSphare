'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Vote,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get('code') || searchParams.get('token') || '';

  const [inputCode, setInputCode] = useState(prefillCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    const raw = inputCode.trim();

    if (!raw) {
      setError('Please enter an election voting link, token, or election code.');
      return;
    }

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      // 1. Check if the input is a full URL
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.includes('/vote/') || raw.includes('/e/')) {
        try {
          const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
          const pathname = parsed.pathname;

          if (pathname.includes('/vote/')) {
            router.push(pathname);
            return;
          } else if (pathname.includes('/e/')) {
            router.push(pathname);
            return;
          } else if (pathname.includes('/join/')) {
            router.push(pathname);
            return;
          }
        } catch {
          // If URL parsing fails, continue to token evaluation
        }
      }

      // 2. Check if input is a UUID or slug/token
      const cleanToken = raw.replace(/^#/, '').trim();
      
      // Attempt verification lookup against public election route
      router.push(`/vote/${encodeURIComponent(cleanToken)}`);
    } catch (err) {
      setError(err.message || 'Unable to resolve election code. Please verify with your election organizer.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Vote className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Join an Election</h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter your voting link, invitation token, or election code to access your ballot.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Info Alert */}
          {infoMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs font-semibold text-blue-300 animate-in fade-in">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
              <div>{infoMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="election-code" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Election Link, Invitation Token, or Code
              </label>
              <input
                id="election-code"
                type="text"
                placeholder="e.g. votesphere.org/vote/abc123xyz or token"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Continue to Election</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Help & Organizer Note */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Don&apos;t have a link?</strong> Ask your election organizer or school/organization administrator to share your voter invitation link.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Eligibility verification and ballot privacy depend on each election&apos;s configured voting rules.
              </span>
            </div>
          </div>

          {/* Action to create election */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 text-center text-xs text-slate-400">
            Want to conduct an election for your organization?{' '}
            <Link href="/onboarding/organization" className="font-bold text-blue-400 hover:underline">
              Create an election
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
