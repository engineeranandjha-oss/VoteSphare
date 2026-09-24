import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  School,
  GraduationCap,
  Building2,
  Users,
  HeartHandshake,
  Home,
  ArrowRight,
  CheckCircle2,
  Shield,
  Vote,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

const useCaseData = {
  schools: {
    title: 'School & Academy Elections',
    subtitle: 'Fair, transparent student council and committee voting',
    hero: 'Run student council, class representative, house captain, and club elections with ease.',
    icon: School,
    color: 'from-blue-600 to-cyan-600',
    capabilities: [
      {
        title: 'Grade-Level Rosters',
        desc: 'Import student lists by class or grade to ensure only eligible electors vote for corresponding representatives.',
      },
      {
        title: 'Multi-Position Ballots',
        desc: 'Bundle President, Vice President, Sports Captain, and Arts Prefect on a single unified ballot.',
      },
      {
        title: 'Candidate Profiles & Manifestos',
        desc: 'Provide student candidates with profiles to showcase their visions, goals, and campaign manifestos.',
      },
      {
        title: 'Mobile-First Ballot Casting',
        desc: 'Simple, accessible voting interface designed for school tablets, phones, and computer labs.',
      },
      {
        title: 'Instant Certified Turnout',
        desc: 'Real-time turnout percentages without revealing interim ballot choices.',
      },
      {
        title: 'Exportable Result Summaries',
        desc: 'Download certified PDF/CSV outcome sheets for official school records and assemblies.',
      },
    ],
    examplePositions: ['Head Boy & Head Girl', 'Student Council President', 'House Captains', 'Club Leads'],
  },
  universities: {
    title: 'University & College Elections',
    subtitle: 'Campus-wide student unions and faculty governance elections',
    hero: 'Manage high-volume campus elections across departments, faculties, and student bodies.',
    icon: GraduationCap,
    color: 'from-indigo-600 to-blue-600',
    capabilities: [
      {
        title: 'Bulk Member Import',
        desc: 'Import thousands of student and faculty electors with automated validation and deduplication.',
      },
      {
        title: 'Faculty & Department Access Rules',
        desc: 'Restrict specialized ballot positions to specific departments or academic cohorts.',
      },
      {
        title: 'Turnout Reporting & Audit Logs',
        desc: 'Comprehensive administrative logging for total transparency during union elections.',
      },
      {
        title: 'Custom Results Publication',
        desc: 'Control when results are finalized, verified by the election commissioner, and published.',
      },
      {
        title: 'Multi-Seat Winner Rules',
        desc: 'Support Plurality (First-Past-The-Post), Absolute Majority, or Multi-Seat voting rules.',
      },
      {
        title: 'Verified Invitation Tokens',
        desc: 'Unique single-use voting links dispatched directly to student email accounts.',
      },
    ],
    examplePositions: ['Student Union President', 'VP Academic Affairs', 'Faculty Senate Rep', 'Treasurer'],
  },
  companies: {
    title: 'Company & Workplace Elections',
    subtitle: 'Employee committees, internal councils, and board decisions',
    hero: 'Run workplace committee elections and governance votes with role-based access and verified authentication.',
    icon: Building2,
    color: 'from-emerald-600 to-teal-600',
    capabilities: [
      {
        title: 'Google & Work Email Auth',
        desc: 'Seamless sign-in with corporate Google Workspace accounts through Supabase Auth.',
      },
      {
        title: 'Departmental Filtering',
        desc: 'Scope election eligibility to Engineering, Product, Sales, or All-Hands teams.',
      },
      {
        title: 'Configurable Anonymity',
        desc: 'Guarantee ballot choice separation from voter identity for sensitive committee votes.',
      },
      {
        title: 'Administrative Action Logs',
        desc: 'Full audit history of election setup, voter roster modifications, and results publication.',
      },
      {
        title: 'One-Vote Integrity',
        desc: 'Server-side enforcement preventing duplicate submissions across all devices.',
      },
      {
        title: 'Secure Results Sharing',
        desc: 'Share verified outcome links directly to Slack, Teams, or internal intranets.',
      },
    ],
    examplePositions: ['Employee Representative', 'Diversity & Inclusion Board', 'Workplace Committee', 'Initiative Lead'],
  },
  societies: {
    title: 'Residential Societies & Communities',
    subtitle: 'Resident Welfare Associations (RWA) and Housing Society voting',
    hero: 'Conduct community management committee elections and resident ballots with mobile ease and notice board QR codes.',
    icon: Users,
    color: 'from-amber-600 to-orange-600',
    capabilities: [
      {
        title: 'Notice Board QR Codes',
        desc: 'Generate printable high-resolution QR codes to post in community lobbies and lifts.',
      },
      {
        title: 'WhatsApp Ballot Links',
        desc: 'Dispatch pre-formatted WhatsApp invitation messages with deep-links directly to residents.',
      },
      {
        title: 'Position-Based Management',
        desc: 'Elect President, General Secretary, Treasurer, and Executive Members simultaneously.',
      },
      {
        title: 'Flat & Villa Eligibility Lists',
        desc: 'One-vote-per-unit or verified resident voting rosters.',
      },
      {
        title: 'Transparent Result Publishing',
        desc: 'Share live or certified outcomes with all society members upon poll closing.',
      },
      {
        title: 'Zero Tech Overhead',
        desc: 'Designed for effortless participation on any mobile smartphone without installing apps.',
      },
    ],
    examplePositions: ['RWA President', 'General Secretary', 'Treasurer', 'Block Representative'],
  },
  ngos: {
    title: 'NGOs & Non-Profit Governance',
    subtitle: 'Board elections, member resolutions, and charter amendments',
    hero: 'Run formal association and NGO elections with verifiable voter eligibility and transparent audit records.',
    icon: HeartHandshake,
    color: 'from-purple-600 to-pink-600',
    capabilities: [
      {
        title: 'Formal Election Lifecycle',
        desc: 'Scheduled election opening and closing with automated status transitions.',
      },
      {
        title: 'Member Eligibility Verification',
        desc: 'Verify voting dues and active membership status prior to issuing ballot access.',
      },
      {
        title: 'Candidate Vetting & Manifestos',
        desc: 'Review and approve candidate nominations before presenting them to the electorate.',
      },
      {
        title: 'Meeting Minutes & Result Export',
        desc: 'Permanent record of votes and turnout percentages for annual general meetings (AGM).',
      },
      {
        title: 'Audit Trails',
        desc: 'Detailed chronological logs of all election administrator actions.',
      },
      {
        title: 'Tie-Breaker Rule Definitions',
        desc: 'Pre-configured rules for resolving candidate ties in accordance with organizational bylaws.',
      },
    ],
    examplePositions: ['Board of Trustees', 'Executive Director', 'Audit Committee', 'Charter Amendment'],
  },
  families: {
    title: 'Families & Social Groups',
    subtitle: 'Quick group decisions, trip planning, and family polls',
    hero: 'Make family and friend-group decisions in seconds using a simple shared link—no complex sign-ups.',
    icon: Home,
    color: 'from-rose-600 to-pink-600',
    capabilities: [
      {
        title: '2-Minute Election Setup',
        desc: 'Type your options and generate a shareable voting link in under 2 minutes.',
      },
      {
        title: 'Direct Link & Chat Sharing',
        desc: 'Send the voting link into your family WhatsApp or Telegram group.',
      },
      {
        title: 'Instant Results',
        desc: 'Watch the winning choice emerge as group members cast their selections.',
      },
      {
        title: 'Mobile Accessible',
        desc: 'Works seamlessly on all mobile browsers with a single tap.',
      },
      {
        title: 'No App Required',
        desc: 'Everyone participates directly from their mobile browser without creating accounts.',
      },
      {
        title: 'Private & Secure',
        desc: 'Only people with the link can participate and view the outcome.',
      },
    ],
    examplePositions: ['Vacation Destination', 'Weekend Activity', 'Family Gift Decision', 'Book Club Selection'],
  },
};

export async function generateMetadata({ params }) {
  const data = useCaseData[params.type];
  if (!data) return { title: 'Use Case Not Found' };

  return {
    title: `${data.title} — VoteSphere for Organizations`,
    description: data.hero,
  };
}

export default function OrganizationUseCasePage({ params }) {
  const { type } = params;
  const data = useCaseData[type];

  if (!data) {
    notFound();
  }

  const Icon = data.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/organizations"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Organization Use Cases</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
              <Icon className="h-3.5 w-3.5" />
              <span>{data.subtitle}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {data.title}
            </h1>
            <p className="text-base text-slate-300">{data.hero}</p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/onboarding/organization"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all"
              >
                <span>Create an Election</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-6 py-3.5 text-sm font-bold text-slate-300 hover:text-white transition-all"
              >
                <span>How It Works</span>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-400 shadow-xl">
            <Icon className="h-16 w-16" />
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Platform Capabilities for {data.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.capabilities.map((cap, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-md hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <h3 className="text-sm font-bold text-white">{cap.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Example Ballots & Positions Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Typical Positions & Ballot Templates</h3>
          </div>
          <p className="text-xs text-slate-400">
            Easily configure single or multi-position ballots with customizable candidate rosters and voting rules:
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {data.examplePositions.map((pos, idx) => (
              <span
                key={idx}
                className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200"
              >
                {pos}
              </span>
            ))}
          </div>
        </div>

        {/* Security & Disclaimer Banner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 flex items-start gap-4 text-xs text-slate-400">
          <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white">Security & Privacy Assurance:</strong>
            <p>
              VoteSphere enforces server-side vote validation, duplicate-vote prevention, and administrative audit logging. Voting privacy and visibility depend on each election&apos;s configured voting rules.
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
