'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import BillingOverview from '@/components/billing/BillingOverview';
import UsageMeters from '@/components/billing/UsageMeters';
import InvoiceTable from '@/components/billing/InvoiceTable';
import { Loader2 } from 'lucide-react';

export default function OrgBillingPage() {
  const { orgId } = useParams();
  const [org, setOrg] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [orgRes, billingRes] = await Promise.all([
        fetch(`/api/orgs/${orgId}`),
        fetch(`/api/orgs/${orgId}/billing`),
      ]);

      const [orgJson, billingJson] = await Promise.all([
        orgRes.json(),
        billingRes.json(),
      ]);

      if (!orgRes.ok) {
        throw new Error(orgJson.message || 'Failed to load organization');
      }
      if (!billingRes.ok) {
        throw new Error(billingJson.message || 'Failed to load billing details');
      }

      setOrg(orgJson.data);
      setBillingData(billingJson.data);
    } catch (err) {
      setError(err.message || 'Error loading billing data');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <DashboardHeader org={org} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-medium">Loading organization billing telemetry...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <>
            {/* 1. Subscription & Plan Overview */}
            <BillingOverview
              orgId={orgId}
              plan={billingData?.plan}
              subscription={billingData?.subscription}
              statusBadge={billingData?.statusBadge}
              isGracePeriod={billingData?.isGracePeriod}
              gracePeriodEnd={billingData?.gracePeriodEnd}
              canManageBilling={billingData?.canManageBilling}
              onRefresh={loadData}
            />

            {/* 2. Resource Telemetry Progress Meters */}
            <UsageMeters
              usage={billingData?.usage}
              planName={billingData?.plan?.name}
            />

            {/* 3. GST Tax Invoices & Receipt Archive */}
            <InvoiceTable orgId={orgId} />
          </>
        )}
      </main>
    </div>
  );
}

