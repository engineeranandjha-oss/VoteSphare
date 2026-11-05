'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RevenueKPICards from '@/components/admin/RevenueKPICards';
import PlanDistributionChart from '@/components/admin/PlanDistributionChart';
import {
  TrendingUp,
  CreditCard,
  Search,
  RefreshCw,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminBillingDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/billing/metrics');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch financial metrics');
      setMetrics(json.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchTransactions = useCallback(
    async (page = 1, status = statusFilter, search = searchQuery) => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '15',
        });
        if (status) params.set('status', status);
        if (search) params.set('search', search);

        const res = await fetch(`/api/admin/billing/transactions?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to fetch platform transactions');

        setTransactions(json.data.transactions || []);
        setPagination(json.data.pagination || { page, limit: 15, total: 0, totalPages: 1 });
      } catch (err) {
        setError(err.message);
      }
    },
    [statusFilter, searchQuery]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchMetrics(), fetchTransactions(1)]);
    setLoading(false);
  }, [fetchMetrics, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMetrics(), fetchTransactions(pagination.page)]);
    setRefreshing(false);
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    fetchTransactions(1, status, searchQuery);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions(1, statusFilter, searchQuery);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'captured':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Captured</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-3 h-3" />
            <span>Refunded</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-xs text-slate-400 font-medium">Loading Platform Revenue Intelligence...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Superadmin Command Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
              <span>Revenue & Billing Analytics</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time gross transaction telemetry, subscription MRR/ARR, customer conversion, and audit logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Revenue KPI Cards */}
        <RevenueKPICards kpis={metrics?.kpis || {}} />

        {/* 2. Subscription Plan Distribution */}
        <PlanDistributionChart distribution={metrics?.planDistribution || {}} />

        {/* 3. Platform Transactions Ledger */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>Platform Transactions & GST Invoices</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete audit trail of all customer transactions across VoteSphere
              </p>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
              {[
                { label: 'All', value: '' },
                { label: 'Captured', value: 'captured' },
                { label: 'Refunded', value: 'refunded' },
                { label: 'Failed', value: 'failed' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleFilterChange(tab.value)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === tab.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Payment ID, Order ID, or Subscription ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Workspace / Organization</th>
                  <th className="py-3 px-4">Payer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment Reference</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No platform transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.organization ? (
                          <Link
                            href={`/org/${tx.organization.id}/dashboard`}
                            className="font-semibold text-slate-200 hover:text-blue-400 transition-colors flex items-center gap-1 group"
                          >
                            <span>{tx.organization.name}</span>
                            <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
                          </Link>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {tx.user ? (
                          <div>
                            <p className="font-medium">{tx.user.name}</p>
                            <p className="text-[10px] text-slate-500">{tx.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-400 tracking-wider">
                        {tx.paymentType || 'subscription'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        {tx.formattedAmount}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(tx.status)}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {tx.razorpayPaymentId || tx.razorpayOrderId || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {tx.invoice && tx.organization ? (
                          <a
                            href={`/api/orgs/${tx.organization.id}/invoices/${tx.invoice.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700 text-[11px] font-medium text-slate-300 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{tx.invoice.invoiceNumber}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchTransactions(pagination.page - 1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchTransactions(pagination.page + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

