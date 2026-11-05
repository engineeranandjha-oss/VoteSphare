'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
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
  Printer,
  Loader2,
} from 'lucide-react';

import Logo from '@/components/common/Logo';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialReceipt =
    searchParams.get('receipt') ||
    searchParams.get('receiptId') ||
    searchParams.get('eligibilityId') ||
    searchParams.get('id') ||
    '';

  const [receiptInput, setReceiptInput] = useState(initialReceipt);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const performVerification = useCallback(async (codeToVerify) => {
    if (!codeToVerify || !codeToVerify.trim()) return;
    try {
      setLoading(true);
      startGlobalProgress();
      setError(null);
      setResult(null);

      const res = await fetch(
        `/api/verify?receipt=${encodeURIComponent(codeToVerify.trim())}`,
        { cache: 'no-store' }
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message ||
            'No verified ballot record found matching this receipt identifier.'
        );
      }

      setResult(json.data);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the receipt identifier.');
    } finally {
      setLoading(false);
      completeGlobalProgress();
    }
  }, []);

  useEffect(() => {
    if (initialReceipt) {
      performVerification(initialReceipt);
    }
  }, [initialReceipt, performVerification]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (receiptInput.trim()) {
      performVerification(receiptInput.trim());
    }
  };

  const copyToClipboard = async (text, type = 'id') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={36} className="group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-base font-black text-white">VoteSphere</span>
              <span className="text-xs text-cyan-400 font-semibold ml-2 hidden sm:inline">
                • Public Verification Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/voter"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              Voter Dashboard →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Hero Introduction */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
            <Lock className="h-3.5 w-3.5" />
            End-to-End Cryptographic Verifiability
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Verify Your Election Record
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Use your verification information to confirm that your election participation was recorded by VoteSphere.
          </p>
        </div>

        {/* Verification Search Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Enter Receipt ID or Eligibility Reference
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-5 w-5 text-slate-500 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={receiptInput}
                  onChange={(e) => setReceiptInput(e.target.value)}
                  placeholder="e.g. VS-XXXX-XXXX-XXXX-XXXX or UUID..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !receiptInput.trim()}
                aria-busy={loading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 font-bold text-sm text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Receipt...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify Receipt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-6 rounded-3xl bg-red-950/30 border border-red-500/30 text-red-300 space-y-2 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Ballot Record Not Found</h3>
              <p className="text-xs text-red-300/90 mt-0.5 leading-relaxed">{error}</p>
              <p className="text-xs text-slate-400 mt-2">
                Make sure you typed the entire Receipt ID (e.g. VS-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX) or
                Eligibility ID provided upon ballot submission.
              </p>
            </div>
          </div>
        )}

        {/* Successful Verification Result Certificate */}
        {result && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/20 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden print:bg-white print:text-black print:border-black">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      Authenticity Verified
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ledger Sealed
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Official Ballot Receipt Certificate
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all border border-slate-700 flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>

            {/* Certificate Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Election Details */}
              <div className="space-y-4 bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-cyan-400" />
                  <span>Election Details</span>
                </h3>

                <div className="space-y-2">
                  <div className="text-lg font-bold text-white">
                    {result.election?.title}
                  </div>
                  {result.election?.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {result.election.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                    <span className="font-semibold text-cyan-300">
                      {result.election?.organization?.name}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                      {result.election?.status === 'published' ? 'Certified Published' : result.election?.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ballot & Timestamp */}
              <div className="space-y-4 bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  <span>Ledger Timestamp & Proof</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Timestamp Cast:</span>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {new Date(result.timestamp).toLocaleString(undefined, {
                        dateStyle: 'full',
                        timeStyle: 'medium',
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-slate-300 font-medium">
                      {result.positionsVotedCount} Contested Position(s) Recorded
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Proof Hashes */}
            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Receipt Token & Cryptographic Hash Proof
                  </span>
                </div>
              </div>

              {/* Receipt ID */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-slate-500 mr-2 text-[11px]">Receipt ID:</span>
                  <span className="text-cyan-300 font-bold tracking-wider">
                    {result.receiptId || result.eligibilityId}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(result.receiptId || result.eligibilityId, 'id')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] self-end sm:self-auto"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Ledger Proof Hash (SHA-256) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs">
                <div className="min-w-0">
                  <span className="text-slate-500 block text-[10px]">SHA-256 LEDGER HASH:</span>
                  <span className="text-slate-300 break-all text-[11px]">
                    {result.ledgerProofHash}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(result.ledgerProofHash, 'hash')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] shrink-0 self-end sm:self-auto"
                >
                  {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>
            </div>

            {/* QR Code & Results CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-800">
              {result.qrCode && (
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 bg-white p-1 rounded-xl shadow-lg shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result.qrCode}
                      alt="Verification QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="font-bold text-white flex items-center gap-1">
                      <QrCode className="h-3.5 w-3.5 text-cyan-400" />
                      Scan to Verify
                    </span>
                    <p className="mt-0.5 text-[11px]">
                      Anyone can scan this QR code on a mobile device to independently verify this receipt.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Link
                  href={`/e/${result.election?.id}/results`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 transition-all"
                >
                  <span>{result.isCertified ? 'View Certified Results' : 'View Election Tally'}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Privacy Dissociation Assurance Guarantee */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-400 flex items-start gap-3">
              <Lock className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300">Anonymity & Privacy Guarantee:</span>{' '}
                VoteSphere enforces strict blind cryptographic dissociation. Your ballot receipt proves
                that your vote was successfully cast and counted, while ensuring your candidate choices
                remain mathematically decoupled from your personal identity.
              </div>
            </div>
          </div>
        )}

        {/* End-to-End Verifiability Explanation Section */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
            How VoteSphere Verifiability Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider">
                1. Cast as Intended
              </div>
              <h3 className="text-sm font-bold text-white">Client-side Encryption</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your selections are validated and signed with zero risk of in-flight tampering.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                2. Recorded as Cast
              </div>
              <h3 className="text-sm font-bold text-white">Immutable Ledger Proof</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ballots are hashed into the audit ledger with immutable SHA-256 sequence timestamps.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="text-purple-400 text-xs font-bold uppercase tracking-wider">
                3. Tallied as Recorded
              </div>
              <h3 className="text-sm font-bold text-white">Publicly Auditable Tallies</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Published results can be audited and mathematically verified against total cast receipts.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
