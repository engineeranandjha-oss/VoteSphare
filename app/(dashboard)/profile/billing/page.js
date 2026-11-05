'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function BillingInvoicesPage() {
  const [userOrgs, setUserOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch user organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoadingOrgs(true);
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const json = await res.json();
          const orgs = json.data?.userOrganizations || [];
          setUserOrgs(orgs);
          const firstAdminOrg = orgs.find((o) => o.isOwner || o.userRole === 'admin') || orgs[0];
          if (firstAdminOrg) {
            setSelectedOrgId(firstAdminOrg.id);
          }
        }
      } catch (err) {
        setError('Failed to load billing organizations');
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrgs();
  }, []);

  // 2. Fetch invoices for selected org
  const fetchInvoices = useCallback(async (orgId) => {
    if (!orgId) return;
    try {
      setLoadingInvoices(true);
      setError(null);
      const res = await fetch(`/api/orgs/${orgId}/invoices`);
      if (res.ok) {
        const json = await res.json();
        setInvoices(json.data || []);
      } else if (res.status === 403) {
        setInvoices([]);
        setError('You do not have administrative permission to view invoices for this organization.');
      } else {
        setInvoices([]);
      }
    } catch (err) {
      setError('Error loading organization invoices');
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      fetchInvoices(selectedOrgId);
    }
  }, [selectedOrgId, fetchInvoices]);

  if (loadingOrgs) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading billing workspace...</p>
      </div>
    );
  }

  const selectedOrg = userOrgs.find((o) => o.id === selectedOrgId);

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Billing & Tax Invoices
            </h2>
            <p className="text-xs text-slate-400">
              Official GST-compliant tax invoices and settlement receipts
            </p>
          </div>
        </div>

        {/* Organization Switcher Dropdown */}
        {userOrgs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Workspace:</span>
            <select
              value={selectedOrgId || ''}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userOrgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.userRole || 'Member'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{error}</span>
          </div>
        )}

        {loadingInvoices ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
            Fetching invoice history...
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No Invoices on Record</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              There are no billing transactions or paid invoices for{' '}
              <strong className="text-slate-300">{selectedOrg?.name || 'this workspace'}</strong>.
              All free tier usage is strictly complimentary.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Invoice No.</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Receipt PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-semibold text-white">
                      {inv.invoiceNumber}
                    </td>

                    <td className="px-4 py-3.5 text-slate-300">
                      {inv.issuedAt
                        ? new Date(inv.issuedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-white">
                      {inv.formattedTotalAmount || `₹${inv.totalAmount}`}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{inv.status?.toUpperCase() || 'PAID'}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <a
                        href={inv.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] transition-colors inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

