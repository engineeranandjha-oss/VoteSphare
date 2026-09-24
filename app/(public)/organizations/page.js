import Link from 'next/link';
import {
  GraduationCap,
  School,
  Building2,
  Users,
  HeartHandshake,
  Home,
  ArrowRight,
  CheckCircle2,
  Vote,
} from 'lucide-react';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'VoteSphere for Organizations — Tailored Elections for Every Group',
  description:
    'Discover how schools, universities, companies, residential societies, NGOs, and families use VoteSphere for trusted online voting.',
};

const orgTypes = [
  {
    slug: 'schools',
    title: 'Schools & Academies',
    subtitle: 'Student Councils, Class Reps & Club Elections',
    description:
      'Empower student leadership with simple, secure voting. Configure student rosters, candidate manifestos, and publish transparent results.',
    icon: School,
    color: 'from-blue-600 to-cyan-600',
    features: [
      'Student eligibility lists & grade-level rosters',
      'Multi-position ballots (President, Vice President, House Captains)',
      'Candidate photo profiles & manifestos',
      'Mobile-optimized ballot casting',
    ],
  },
  {
    slug: 'universities',
    title: 'Universities & Colleges',
    subtitle: 'Student Unions, Faculty Senate & Campus Referendums',
    description:
      'Manage high-volume campus elections across departments and student bodies with CSV roster imports and live turnout metrics.',
    icon: GraduationCap,
    color: 'from-indigo-600 to-blue-600',
    features: [
      'Bulk member import & university email verification',
      'Department-specific ballot access rules',
      'Turnout monitoring & audit logs',
      'Public results publication with tie resolution rules',
    ],
  },
  {
    slug: 'companies',
    title: 'Companies & Teams',
    subtitle: 'Employee Committees, Board Elections & Strategic Votes',
    description:
      'Conduct workplace voting with role-based access, department eligibility controls, and configurable privacy options.',
    icon: Building2,
    color: 'from-emerald-600 to-teal-600',
    features: [
      'Verified Google authentication & corporate email access',
      'Departmental voter eligibility filtering',
      'Administrative audit logs for compliance',
      'One-vote enforcement with duplicate prevention',
    ],
  },
  {
    slug: 'societies',
    title: 'Residential Societies & Communities',
    subtitle: 'Resident Welfare Associations (RWA) & Housing Societies',
    description:
      'Conduct community elections and general body decisions with QR code voting, mobile-first ballots, and instant results.',
    icon: Users,
    color: 'from-amber-600 to-orange-600',
    features: [
      'Shareable voting links & QR code access for notice boards',
      'Mobile-first voting for all age groups',
      'Position-based voting (President, Secretary, Treasurer)',
      'Verified participation receipts',
    ],
  },
  {
    slug: 'ngos',
    title: 'NGOs & Non-Profits',
    subtitle: 'Board Elections, Member Ballots & Association Governance',
    description:
      'Run formal elections for non-profit governance, board members, and charter amendments with auditable records.',
    icon: HeartHandshake,
    color: 'from-purple-600 to-pink-600',
    features: [
      'Member eligibility management and invitation tokens',
      'Candidate approvals and profile management',
      'Formal scheduled voting windows',
      'Exportable outcome records for meeting minutes',
    ],
  },
  {
    slug: 'families',
    title: 'Families & Groups',
    subtitle: 'Trip Planning, Group Decisions & Family Polls',
    description:
      'Make group decisions quickly with a simple shared link—no complex setup required.',
    icon: Home,
    color: 'from-rose-600 to-pink-600',
    features: [
      'Instant election creation in under 2 minutes',
      'Direct link and WhatsApp sharing',
      'Simple multiple-choice and ranking ballots',
      'Real-time outcome visibility',
    ],
  },
];

export default function OrganizationsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400 mb-4">
            <Building2 className="h-3.5 w-3.5" />
            <span>Built for Every Community</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Elections Tailored for Your Organization
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Whether you are managing a 10,000-student university election, a company committee, or a community poll, VoteSphere provides the right controls, privacy, and workflows.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {orgTypes.map((org) => {
            const Icon = org.icon;
            return (
              <div
                key={org.slug}
                className="group flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl transition-all duration-300 hover:border-slate-700 hover:bg-slate-900 hover:shadow-2xl"
              >
                <div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr ${org.color} text-white shadow-lg mb-6 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">{org.title}</h3>
                  <div className="text-xs font-semibold text-blue-400 mb-3">{org.subtitle}</div>
                  <p className="text-sm text-slate-400 mb-6">{org.description}</p>

                  <ul className="space-y-2.5 mb-8">
                    {org.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <Link
                    href={`/organizations/${org.slug}`}
                    className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Explore Use Case</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <Link
                    href="/onboarding/organization"
                    className="text-xs font-bold text-blue-400 hover:underline"
                  >
                    Start Election
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/60 p-10 sm:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black text-white">Ready to run your first election?</h2>
            <p className="text-sm text-slate-300">
              Create an organization in minutes, configure positions and candidate manifestos, and invite your voters with ease.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/onboarding/organization"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all"
              >
                <span>Create an Election</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-6 py-3.5 text-sm font-bold text-slate-300 hover:text-white transition-all"
              >
                <Vote className="h-4 w-4 text-blue-400" />
                <span>Join an Election</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
