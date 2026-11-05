'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, AlertTriangle, ArrowRight, LayoutDashboard } from 'lucide-react';

function PendingContent() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId') || '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Verification In Progress
          </span>
          <h1 className="text-2xl font-black text-white">Payment Processing</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your bank is processing the e-mandate authentication. This normally takes between a few seconds and a few minutes to confirm.
          </p>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left text-xs text-amber-200/90 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>7-Day Election Integrity Guarantee</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            All your ongoing and scheduled elections will remain online and accessible to voters without interruption while your bank completes verification.
          </p>
        </div>

        <div className="pt-2">
          {orgId ? (
            <Link
              href={`/org/${orgId}/dashboard`}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
            >
              <span>Return Home</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">Loading status...</div>}>
      <PendingContent />
    </Suspense>
  );
}

