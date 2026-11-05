import OrgOnboardingWizard from '@/components/orgs/OrgOnboardingWizard';
import Link from 'next/link';
import Logo from '@/components/common/Logo';

export const metadata = {
  title: 'Welcome to VoteSphere — Organization Setup',
  description: 'Complete your organization onboarding to begin launching elections.',
};

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-3xl mx-auto mb-8 sm:mb-10 text-center flex flex-col items-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-5 sm:mb-6 group focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-xl p-1">
          <Logo size={38} className="group-hover:scale-105 transition-transform shrink-0" />
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Vote<span className="text-blue-400">Sphere</span>
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight px-2">
          Welcome! Let&apos;s Set Up Your Workspace
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 sm:mt-2.5 max-w-md mx-auto leading-relaxed px-2">
          Create your organization in just 3 quick steps to start configuring ballots and inviting voters.
        </p>
      </div>

      <OrgOnboardingWizard />
    </main>
  );
}
