import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import { FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — VoteSphere',
  description: 'Review the terms and conditions governing the use of the VoteSphere platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
            <FileText className="h-3.5 w-3.5" />
            <span>Platform Guidelines</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Terms of Service</h1>
          <p className="text-xs text-slate-400">Effective Date: September 2026</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12 space-y-8 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
              1. Acceptable Use & Organizer Responsibilities
            </h2>
            <p>
              By creating an organization or administering an election on VoteSphere, you represent that you are authorized to conduct elections on behalf of your school, company, society, or group, and that your voter roster accurate reflects eligible participants.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              2. Prohibited Conduct
            </h2>
            <p>
              Users may not attempt to impersonate electors, bypass eligibility gates, submit automated ballots, manipulate audit logs, or interfere with election infrastructure. Violations result in immediate account termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              3. Outcome Integrity & Finality
            </h2>
            <p>
              VoteSphere calculates election results in strict accordance with the rules defined by the election organizer (Plurality, Absolute Majority, Multi-Seat). The platform is a tool for civic administration; election disputes are subject to the governing bylaws of each respective organization.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
