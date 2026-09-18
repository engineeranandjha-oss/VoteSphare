import OrgOnboardingWizard from '@/components/orgs/OrgOnboardingWizard';

export const metadata = {
  title: 'Create Organization — VoteSphere',
  description: 'Set up a new organization workspace to manage elections and ballots.',
};

export default function NewOrgPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <OrgOnboardingWizard />
    </main>
  );
}
