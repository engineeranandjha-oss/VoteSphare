'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ElectionTable from '@/components/dashboard/ElectionTable';
import Link from 'next/link';

export default function OrgElectionsListPage({ params }) {
  const { orgId } = params;
  const [org, setOrg] = useState(null);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [orgRes, elecRes] = await Promise.all([
        fetch(`/api/orgs/${orgId}`),
        fetch(`/api/orgs/${orgId}/elections?limit=100`),
      ]);

      const orgJson = await orgRes.json();
      const elecJson = await elecRes.json();

      if (!orgRes.ok) {
        throw new Error(orgJson.message || 'Failed to load organization');
      }

      setOrg(orgJson.data);
      setElections(elecJson.data?.elections || elecJson.data || []);
    } catch (err) {
      setError(err.message || 'Error loading elections');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-14 bg-slate-900 rounded-2xl w-full animate-pulse" />
          <div className="h-96 bg-slate-900 rounded-3xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !org) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Organization not found.'}</p>
          <Link
            href={`/org/${orgId}/dashboard`}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const canManage = org?.userRole === 'owner' || org?.userRole === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <DashboardHeader org={org} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ElectionTable elections={elections} orgId={orgId} canManage={canManage} />
      </main>
    </div>
  );
}
