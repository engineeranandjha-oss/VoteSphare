import OrgOnboardingWizard from '@/components/orgs/OrgOnboardingWizard';
import Link from 'next/link';
import { Vote } from 'lucide-react';

export const metadata = {
  title: 'Welcome to VoteSphere — Organization Setup',
  description: 'Complete your organization onboarding to begin launching elections.',
};

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto mb-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
            <Vote className="h-5 w-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Vote<span className="text-blue-400">Sphere</span>
          </span>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Welcome! Let&apos;s Set Up Your Workspace
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Create your organization in just 3 quick steps to start configuring ballots and inviting voters.
        </p>
      </div>

      <OrgOnboardingWizard />
    </main>
  );
}
