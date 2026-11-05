import Link from 'next/link';
import {
  Vote,
  PlusCircle,
  Building2,
  GraduationCap,
  School,
  Users,
  HeartHandshake,
  Home as HomeIcon,
  ArrowRight,
} from 'lucide-react';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import FeatureGrid from '@/components/landing/FeatureGrid';
import SecurityTrustSection from '@/components/landing/SecurityTrustSection';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'VoteSphere — Create, Run & Share Trusted Elections Online',
  description:
    'The trusted online voting platform for schools, universities, companies, residential societies, NGOs, families, and groups.',
};

const useCases = [
  {
    type: 'schools',
    title: 'Schools & Academies',
    subtitle: 'Student council elections, class representatives, school committees, and student organizations.',
    icon: School,
    color: 'from-blue-600 to-cyan-600',
  },
  {
    type: 'universities',
    title: 'Universities & Colleges',
    subtitle: 'Student elections, campus committees, academic organizations, and university governance.',
    icon: GraduationCap,
    color: 'from-indigo-600 to-blue-600',
  },
  {
    type: 'companies',
    title: 'Companies & Teams',
    subtitle: 'Leadership elections, internal committees, employee voting, and organizational decisions.',
    icon: Building2,
    color: 'from-emerald-600 to-teal-600',
  },
  {
    type: 'societies',
    title: 'Residential Societies',
    subtitle: 'Committee elections, RWA decisions, AGM resolutions, and community voting.',
    icon: Users,
    color: 'from-amber-600 to-orange-600',
  },
  {
    type: 'ngos',
    title: 'NGOs & Non-Profits',
    subtitle: 'Board elections, member decisions, committees, and organizational resolutions.',
    icon: HeartHandshake,
    color: 'from-purple-600 to-pink-600',
  },
  {
    type: 'families',
    title: 'Families & Groups',
    subtitle: 'Private group decisions, club elections, event voting, and community decisions.',
    icon: HomeIcon,
    color: 'from-rose-600 to-pink-600',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* 1. Public Header */}
      <PublicNavbar />

      <main className="flex-1 space-y-16">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Action Cards (Create / Join) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Card: Create Election */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 p-8 shadow-2xl flex flex-col justify-between hover:border-blue-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black text-white">Create an Election</h2>
                <p className="text-sm text-slate-400">
                  Set up your organization and launch your next election.
                </p>
              </div>

              <div className="pt-6">
                <Link
                  href="/onboarding/organization"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all"
                >
                  <span>Create an Election</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Action Card: Join Election */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-8 shadow-2xl flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Vote className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black text-white">Join an Election</h2>
                <p className="text-sm text-slate-400">
                  Enter your election link or code to access your ballot.
                </p>
              </div>

              <div className="pt-6">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <span>Join an Election</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Use-Case Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              <span>Tailored Solutions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Built for the Organizations That Run Elections
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Select your organization type to explore specialized features, eligibility workflows, and ballot templates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <Link
                  key={uc.type}
                  href={`/organizations/${uc.type}`}
                  className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl hover:border-slate-700 hover:bg-slate-900 transition-all flex items-start gap-4"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${uc.color} text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      {uc.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {uc.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/organizations"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
            >
              <span>View all organization features & capabilities</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* 5. 5-Step Product Workflow */}
        <HowItWorks />

        {/* 6. Organizer & Voter Experience Suite */}
        <FeatureGrid />

        {/* 7. Security Architecture */}
        <SecurityTrustSection />

        {/* 8. Final CTA Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/60 p-10 sm:p-14 text-center shadow-2xl space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Ready to Run Your Next Election?
            </h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              Create your election, invite eligible voters, and manage the entire voting process from one platform.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/onboarding/organization"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all"
              >
                <span>Create an Election</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-7 py-3.5 text-sm font-bold text-slate-300 hover:text-white transition-all"
              >
                <Vote className="h-4 w-4 text-emerald-400" />
                <span>Join an Election</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Public Footer */}
      <LandingFooter />
    </div>
  );
}
