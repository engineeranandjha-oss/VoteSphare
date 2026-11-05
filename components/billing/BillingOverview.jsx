'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  XCircle,
  Loader2,
} from 'lucide-react';

export default function BillingOverview({
  orgId,
  plan,
  subscription,
  statusBadge,
  isGracePeriod,
  gracePeriodEnd,
  canManageBilling,
  onRefresh,
}) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState(null);

  const isFreePlan = plan?.slug === 'free' || !subscription;
  const isCancelled = Boolean(subscription?.cancellationDate);

  async function handleCancelSubscription() {
    try {
      setCancelling(true);
      setCancelError(null);

      const res = await fetch('/api/billing/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          cancelAtCycleEnd: true,
          reason: 'User initiated cancellation from billing dashboard',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to cancel subscription');
      }

      setCancelSuccessMsg(json.message || 'Subscription cancelled successfully');
      setCancelModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  }

  const formattedRenewal = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const formattedGraceEnd = gracePeriodEnd
    ? new Date(gracePeriodEnd).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">{plan?.name || 'Free Plan'}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                    statusBadge?.color === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : statusBadge?.color === 'amber'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : statusBadge?.color === 'rose'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {statusBadge?.label || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFreePlan
                  ? 'Community tier for personal and small-group elections'
                  : `Recurring ${plan?.billingInterval || 'monthly'} subscription`}
              </p>
            </div>
          </div>

          {canManageBilling && (
            <div className="flex items-center gap-2.5">
              <Link
                href={`/pricing?orgId=${orgId}`}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isFreePlan ? 'Upgrade Plan' : 'Change Plan'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              {!isFreePlan && !isCancelled && (
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-900 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        {/* Success Alert Banner */}
        {cancelSuccessMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{cancelSuccessMsg}</span>
          </div>
        )}

        {/* 7-Day Grace Period Alert */}
        {isGracePeriod && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-300">
                Payment Renewal Declined — 7-Day Grace Period Active
              </h4>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Your bank declined the scheduled subscription renewal. To ensure zero disruption to democratic governance, <strong>all live and scheduled elections remain operational until {formattedGraceEnd || '7 days'}</strong>. Please update your payment method to avoid falling back to the Free tier.
              </p>
              {canManageBilling && (
                <div className="pt-2">
                  <Link
                    href={`/pricing?orgId=${orgId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:underline"
                  >
                    <span>Update Payment Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancellation Scheduled Alert */}
        {isCancelled && (
          <div className="mb-6 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-400">
            <Clock className="w-4 h-4 shrink-0 text-slate-400" />
            <span>
              Your subscription will cancel automatically at the end of the current billing cycle on <strong>{formattedRenewal || 'period end'}</strong>. You retain full access until then. Past elections and audit logs remain permanently accessible.
            </span>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pricing Rate
            </span>
            <div className="text-lg font-black text-white">
              {plan?.formattedPrice || '₹0'}
              <span className="text-xs font-normal text-slate-400 ml-1">
                {isFreePlan ? 'forever' : `/${plan?.billingInterval || 'mo'}`}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Next Renewal / Expiry
            </span>
            <div className="text-lg font-bold text-slate-200">
              {formattedRenewal || (isFreePlan ? 'No Expiry' : '—')}
            </div>
          </div>

          <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Constitutional Guarantee
            </span>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Ballot Isolation Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <XCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Cancel Subscription?</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Your subscription will remain active until <strong>{formattedRenewal || 'the end of your current cycle'}</strong>. After that, your organization will transition to the Free tier.
              <br /><br />
              <strong className="text-slate-300">Data Preservation Promise:</strong> No elections, voter participation histories, or cryptographic ballots will ever be deleted.
            </p>

            {cancelError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
              >
                Keep Subscription
              </button>

              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all flex items-center gap-1.5"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

