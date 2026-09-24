import Link from 'next/link';
import {
  HelpCircle,
  Vote,
  Building2,
  Mail,
} from 'lucide-react';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Help Center & Guides — VoteSphere Support',
  description:
    'Frequently asked questions and guides for voters and election administrators using VoteSphere.',
};

const helpCategories = [
  {
    title: 'For Voters',
    icon: Vote,
    color: 'text-emerald-400',
    topics: [
      {
        q: 'How do I join an election and cast my ballot?',
        a: 'Enter the voting link, invitation token, or QR code provided by your election organizer into the Join page (/join). If required by the election rules, sign in with your Google account to verify your eligibility, select your candidates, and confirm your ballot.',
      },
      {
        q: 'Can anyone see who I voted for?',
        a: 'For elections configured as Anonymous, your ballot choice is completely decoupled from your personal profile and email in the database. Administrators and organizers can see that you voted (turnout), but never which candidate you chose.',
      },
      {
        q: 'Why am I seeing an "Ineligible to Vote" message?',
        a: 'Ineligibility occurs if your email is not on the election roster, if the election has not started yet, or if a ballot was already cast using your account. Reach out to your election organizer if you believe you were omitted by error.',
      },
      {
        q: 'Can I change my vote after submitting?',
        a: 'By default, votes are final once confirmed to preserve election integrity and prevent coercion. If an election explicitly permits ballot updates in its rules, you can re-open the ballot link before polls close.',
      },
    ],
  },
  {
    title: 'For Organization Administrators',
    icon: Building2,
    color: 'text-blue-400',
    topics: [
      {
        q: 'How do I create and schedule a new election?',
        a: 'From your Organization Workspace (/dashboard), click "New Election". Follow the wizard to enter basic info, set start and end dates, add positions and candidates with manifestos, upload eligible voters via CSV, and publish the ballot.',
      },
      {
        q: 'How do I invite voters and share links?',
        a: 'Once an election is published, navigate to the Invitations tab to copy the canonical voting link, download a high-resolution QR code for notice boards, send batch email invitations, or copy pre-formatted WhatsApp announcement text.',
      },
      {
        q: 'When are election results calculated and visible?',
        a: 'Votes are tallied automatically using your chosen winner rule (Plurality, Majority, Multi-Seat). For certified integrity, results are sealed and only displayed publicly when an administrator closes polls and publishes outcomes.',
      },
      {
        q: 'Can I edit an election after it goes live?',
        a: 'To safeguard ballot validity, positions and voting rules cannot be altered once voting has commenced and ballots have been received. Basic details and closing dates can be adjusted by authorized administrators.',
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Support & Documentation</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            How can we help you?
          </h1>
          <p className="text-base sm:text-lg text-slate-400">
            Explore guides for casting ballots, configuring organization elections, and managing voter rosters.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {helpCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <Icon className={`h-6 w-6 ${cat.color}`} />
                  <h2 className="text-2xl font-bold text-white">{cat.title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cat.topics.map((topic, tIdx) => (
                    <div
                      key={tIdx}
                      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 space-y-3"
                    >
                      <h3 className="text-base font-bold text-white leading-snug">{topic.q}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{topic.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Us Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white">Still have questions?</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Our support team is available to assist with custom election configurations, enterprise onboarding, and technical questions.
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all shrink-0"
          >
            <Mail className="h-4 w-4" />
            <span>Contact Support</span>
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
