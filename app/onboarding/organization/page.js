'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowRight, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import OrgOnboardingWizard from '@/components/orgs/OrgOnboardingWizard';
import Logo from '@/components/common/Logo';

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const { authenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace('/login?next=/onboarding/organization');
    }
  }, [authenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
        <p className="text-xs text-slate-400">Verifying session credentials...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In Required</h2>
          <p className="text-xs text-slate-400">
            Please sign in to create and manage an organization workspace.
          </p>
          <Link
            href="/login?next=/onboarding/organization"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/25"
          >
            <span>Continue to Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-3xl mx-auto mb-8 sm:mb-10 text-center flex flex-col items-center">
        {/* Brand & Badge row / column */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5">
          <Link href="/" className="inline-flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-xl p-1">
            <Logo size={38} className="group-hover:scale-105 transition-transform shrink-0" />
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Vote<span className="text-blue-400">Sphere</span>
            </span>
          </Link>
          <span className="hidden sm:inline text-slate-700 text-lg select-none">•</span>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400 shadow-sm">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>New Organization Workspace</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight px-2">
          Set Up Your Organization
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 sm:mt-2.5 max-w-lg mx-auto leading-relaxed px-2">
          Configure your workspace in 3 quick steps to start building ballots, enrolling voters, and running elections.
        </p>
      </div>

      <OrgOnboardingWizard />
    </main>
  );
}
