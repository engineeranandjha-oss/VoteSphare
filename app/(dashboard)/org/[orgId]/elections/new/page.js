import ElectionWizard from '@/components/elections/ElectionWizard';
import Link from 'next/link';

export const metadata = {
  title: 'Create Election Ballot — VoteSphere',
  description: 'Configure a new multi-position election ballot with candidates and voting rules.',
};

export default function NewElectionPage({ params }) {
  const { orgId } = params;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link
          href={`/org/${orgId}/dashboard`}
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
          Election Creation Studio
        </span>
      </div>

      <ElectionWizard orgId={orgId} />
    </main>
  );
}
