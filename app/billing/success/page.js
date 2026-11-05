'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, ArrowRight, LayoutDashboard, Receipt } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const subId = searchParams.get('subId') || searchParams.get('subscriptionId') || '';
  const orderId = searchParams.get('orderId') || '';
  const orgId = searchParams.get('orgId') || '';
  const planSlug = searchParams.get('plan') || '';

  const referenceId = subId || orderId || 'Verified Transaction';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Payment Verified
          </span>
          <h1 className="text-2xl font-black text-white">Subscription Active</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your payment has been successfully authenticated. Your organization quotas and advanced features are unlocked immediately.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Reference ID</span>
            <span className="font-mono text-white text-[11px]">{referenceId}</span>
          </div>
          {planSlug && (
            <div className="flex justify-between items-center text-slate-400">
              <span>Plan Tier</span>
              <span className="font-bold text-sky-400 capitalize">{planSlug.replace(/-/g, ' ')}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-400">
            <span>Tax Invoice</span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <Receipt className="w-3.5 h-3.5" />
              <span>Available in Dashboard</span>
            </span>
          </div>
        </div>

        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2 text-left">
          <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
          <span>Zero-Knowledge Promise: Ballots remain strictly anonymous and dissociated from this transaction.</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {orgId ? (
            <>
              <Link
                href={`/org/${orgId}/dashboard`}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </Link>

              <Link
                href={`/org/${orgId}/billing`}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Billing Center</span>
              </Link>
            </>
          ) : (
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
            >
              <span>Return to VoteSphere</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">Loading payment details...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

