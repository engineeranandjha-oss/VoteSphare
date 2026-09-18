'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vote, Building2, Plus, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminGatewayPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch('/api/orgs');
        const json = await res.json();
        const list = json.data?.organizations || json.data || [];
        setOrgs(list);

        // If user has exactly one organization, redirect directly to its dashboard
        if (list.length === 1) {
          router.replace(`/org/${list[0].id}/dashboard`);
          return;
        }

        // If user has no organizations, redirect to onboarding
        if (list.length === 0) {
          router.replace('/onboarding');
          return;
        }
      } catch {
        // Fallback: stay on gateway
      } finally {
        setLoading(false);
      }
    }

    loadOrgs();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-400 font-semibold text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span>Loading your workspaces...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-3">
            <Vote className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Select Your Workspace
          </h1>
          <p className="text-sm text-slate-400">
            Choose an organization to open its administrative dashboard.
          </p>
        </div>

        <div className="space-y-3">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/org/${org.id}/dashboard`}
              className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all group shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {org.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    votesphere.com/org/{org.slug}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          ))}

          <Link
            href="/org/new"
            className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-400 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Another Organization
          </Link>
        </div>
      </div>
    </main>
  );
}
