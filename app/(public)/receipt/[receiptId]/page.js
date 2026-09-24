'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Layers,
  Building2,
  Lock,
  FileCheck2,
  QrCode,
  ArrowLeft,
  Printer,
  Share2,
  Download,
  Loader2,
} from 'lucide-react';
import { downloadBallotReceiptPdf } from '@/lib/utils/receipt-pdf';

export default function ReceiptDetailPage({ params }) {
  const { receiptId } = params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchReceipt = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/receipt/${encodeURIComponent(receiptId)}`, {
        cache: 'no-store',
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || 'Ballot receipt not found or invalid identifier.'
        );
      }

      setData(json.data);
    } catch (err) {
      setError(err.message || 'Failed to load ballot receipt.');
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  const copyToClipboard = async (text, type = 'id') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else if (type === 'hash') {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      } else if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    try {
      setDownloadingPdf(true);
      await downloadBallotReceiptPdf({
        receiptId: data.receiptId || data.eligibilityId || receiptId,
        electionId: data.electionId || data.election?.id || '',
        electionTitle: data.electionTitle || data.election?.title || 'Election',
        timestamp: data.castAt || data.timestamp || new Date().toISOString(),
        positionsVotedCount: data.positionsCount || data.positionsVotedCount || 1,
        isAnonymous: data.isAnonymous ?? true,
      });
    } catch (err) {
      console.error('Failed to download PDF receipt:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">
            Validating Cryptographic Ledger Proof...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Invalid Receipt Identifier</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'No verified voting record could be located for this identifier.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/verify"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all shadow-md shadow-cyan-500/20"
            >
              Go to Verification Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white flex flex-col print:bg-white print:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-xl print:hidden">
        <div className="max-w-4xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link
            href="/verify"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Verification Portal</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(window?.location?.href, 'link')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                  <span>PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-slate-300" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Certificate Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 border border-cyan-500/40 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-7 relative overflow-hidden print:border-2 print:border-black print:p-6 print:shadow-none">
          {/* Top Stamp Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-slate-300">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    Official Verification Certificate
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Ballot Sealed
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white print:text-black">
                  VoteSphere Ledger Proof
                </h1>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Verification Protocol
              </span>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                SHA-256 E2E Blind Token
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Election Details */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2 print:border-slate-300">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>Election Information</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white print:text-black">
                {data.election?.title}
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="text-cyan-300 font-semibold">{data.election?.organization?.name}</span>
                <span>•</span>
                <span className="capitalize">{data.election?.status}</span>
              </div>
            </div>

            {/* Timestamp & Positions */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2 print:border-slate-300">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>Ledger Cast Timestamp</span>
              </div>
              <div className="text-sm font-bold text-white print:text-black font-mono">
                {new Date(data.timestamp).toLocaleString(undefined, {
                  dateStyle: 'full',
                  timeStyle: 'medium',
                })}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                <span>{data.positionsVotedCount} Contested Position(s) Recorded</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Hashes Block */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 print:border-slate-300">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-cyan-400" />
              <span>Cryptographic Proof Tokens</span>
            </div>

            {/* Receipt ID */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs print:border-slate-300">
              <div>
                <span className="text-slate-500 mr-2 text-[11px]">RECEIPT ID:</span>
                <span className="text-cyan-300 font-bold tracking-wider">
                  {data.receiptId || data.eligibilityId}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(data.receiptId || data.eligibilityId, 'id')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] self-end sm:self-auto print:hidden"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Full Hash */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs print:border-slate-300">
              <div className="min-w-0">
                <span className="text-slate-500 block text-[10px]">IMMUTABLE SHA-256 PROOF:</span>
                <span className="text-slate-300 break-all text-[11px]">
                  {data.ledgerProofHash}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(data.ledgerProofHash, 'hash')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] shrink-0 self-end sm:self-auto print:hidden"
              >
                {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
              </button>
            </div>
          </div>

          {/* QR Code & Results Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-800 print:border-slate-300">
            {data.qrCode && (
              <div className="flex items-center gap-3.5">
                <div className="w-24 h-24 bg-white p-1.5 rounded-2xl shadow-lg shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.qrCode}
                    alt="Receipt Verification QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-white print:text-black flex items-center gap-1">
                    <QrCode className="h-3.5 w-3.5 text-cyan-400" />
                    Scan to Verify
                  </span>
                  <p className="mt-0.5 text-[11px]">
                    Scan this QR code with any camera or smartphone to view this live cryptographic certificate.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 print:hidden">
              <Link
                href={`/e/${data.election?.id}/results`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 transition-all"
              >
                <span>{data.isCertified ? 'View Certified Results' : 'View Election Tally'}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Dissociation Notice */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-400 flex items-start gap-3 print:border-slate-300 print:text-black">
            <Lock className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5 print:hidden" />
            <div>
              <span className="font-bold text-cyan-300 print:text-black">Ballot Secrecy Certified:</span>{' '}
              This cryptographic certificate confirms your ballot is recorded in the immutable election
              tally while ensuring all candidate choices remain permanently dissociated from voter identity.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
