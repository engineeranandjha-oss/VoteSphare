'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';

function FailedContent() {
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get('error') || 'Your payment could not be completed at this time.';
  const orgId = searchParams.get('orgId') || '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
            Payment Incomplete
          </span>
          <h1 className="text-2xl font-black text-white">Transaction Unsuccessful</h1>
          <p className="text-xs text-rose-300/90 leading-relaxed bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl">
            {errorMsg}
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          No charges were finalized on your account. You can retry with another payment method (UPI, NetBanking, or Credit/Debit Card).
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={orgId ? `/pricing?orgId=${orgId}` : '/pricing'}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Link>

          <Link
            href={orgId ? `/org/${orgId}/dashboard` : '/'}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">Loading...</div>}>
      <FailedContent />
    </Suspense>
  );
}

