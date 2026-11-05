'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

export default function InvoiceTable({ orgId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/orgs/${orgId}/invoices?page=${page}&limit=10`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to load invoices');
      }

      setInvoices(json.data || []);
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages || 1);
        setTotalCount(json.pagination.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Error fetching invoices');
    } finally {
      setLoading(false);
    }
  }, [orgId, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Tax Invoices & Billing History</h3>
            <p className="text-xs text-slate-400">
              Download GST-compliant tax invoices for input tax credits (SAC Code 998313)
            </p>
          </div>
        </div>

        {totalCount > 0 && (
          <span className="text-xs text-slate-400 font-medium">
            {totalCount} {totalCount === 1 ? 'Invoice' : 'Invoices'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-xs">Loading tax invoices...</span>
        </div>
      ) : error ? (
        <div className="py-8 text-center text-xs text-rose-400">
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <FileText className="w-8 h-8 mx-auto stroke-1 opacity-50" />
          <p className="text-xs">No invoices generated yet.</p>
          <p className="text-[11px] text-slate-600">
            When you subscribe or make one-time purchases, official GST tax receipts will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Issued Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {inv.issuedAt
                      ? new Date(inv.issuedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {inv.formattedTotalAmount || `₹${(inv.totalAmount / 100).toFixed(2)}`}
                    <span className="text-[10px] text-slate-500 font-normal ml-1">
                      (incl. 18% GST)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Paid</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={inv.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Download PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

