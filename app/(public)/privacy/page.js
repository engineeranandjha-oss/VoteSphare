import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import { Shield, Eye, FileText, Database, UserCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — VoteSphere',
  description: 'Understand how VoteSphere collects, uses, and safeguards personal data and voter privacy.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
            <Shield className="h-3.5 w-3.5" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12 space-y-8 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-400" />
              1. Information We Collect
            </h2>
            <p>
              VoteSphere collects minimal information required to authenticate participants and administer elections:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li><strong>Authentication Data:</strong> Name, verified email address, and OAuth identifier provided via Supabase Auth / Google OAuth.</li>
              <li><strong>Organization & Membership:</strong> Organization name, role (Owner, Admin, Member, Voter), and roster eligibility records.</li>
              <li><strong>Audit Logs:</strong> Timestamps and actions performed by election administrators to preserve election integrity.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-400" />
              2. Voter Anonymity Architecture
            </h2>
            <p>
              In elections designated as <strong>Anonymous</strong>, your candidate choices are stored in a dissociated dataset without foreign keys or direct linkages to your name, email, or user account.
            </p>
            <p className="text-xs text-slate-400">
              Once a ballot is cast, your eligibility token is marked as consumed to prevent duplicate voting, but the association between your identity and the submitted choices is permanently severed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-400" />
              3. Data Retention & Security
            </h2>
            <p>
              All database connections utilize encrypted TLS communication. Session tokens are stored in secure HTTP-only cookies. Election data is retained according to organization configurations and bylaws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              4. Your Rights
            </h2>
            <p>
              You have the right to review the personal data associated with your user account, request corrections from your organization administrator, or delete your account when not actively engaged in a live election roster.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
