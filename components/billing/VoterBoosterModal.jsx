'use client';

import { useState } from 'react';
import { useRazorpay } from '@/hooks/useRazorpay';
import { VOTER_BOOSTER_PACKS, formatPriceInr } from '@/lib/billing/plans-config';
import {
  Zap,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';

export default function VoterBoosterModal({
  isOpen,
  onClose,
  orgId,
  electionId,
  electionTitle = 'Current Election',
  currentVoterCount = 0,
  currentLimit = 50,
  suggestedBooster = 'booster-250',
  onSuccess,
}) {
  const { isLoaded, openCheckout } = useRazorpay();
  const [selectedSlug, setSelectedSlug] = useState(suggestedBooster || 'booster-250');
  const [customerGstin, setCustomerGstin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const boosterList = Object.values(VOTER_BOOSTER_PACKS);
  const selectedBooster = VOTER_BOOSTER_PACKS[selectedSlug] || boosterList[0];
  const newCapacity = currentLimit + (selectedBooster?.additionalVoters || 0);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // 1. Create one-time booster order
      const createRes = await fetch('/api/billing/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          orderType: 'voter_booster',
          boosterSlug: selectedSlug,
          electionId,
          customerGstin: customerGstin.trim() || undefined,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.message || 'Failed to initiate booster order');
      }

      const { order } = createData.data;

      // 2. Open Razorpay Checkout modal
      const options = {
        key: order.keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'VoteSphere',
        description: selectedBooster.name,
        prefill: {},
        theme: {
          color: '#3b82f6',
        },
      };

      const checkoutResponse = await openCheckout(options);

      // 3. Verify payment signature and fulfill booster credits
      const verifyRes = await fetch('/api/billing/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          electionId,
          razorpay_order_id: checkoutResponse.razorpay_order_id,
          razorpay_payment_id: checkoutResponse.razorpay_payment_id,
          razorpay_signature: checkoutResponse.razorpay_signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || 'Payment verification failed');
      }

      setSuccessMsg(`Successfully added +${selectedBooster.additionalVoters} voter capacity!`);

      if (onSuccess) {
        onSuccess({
          boosterSlug: selectedSlug,
          additionalVoters: selectedBooster.additionalVoters,
          paymentId: checkoutResponse.razorpay_payment_id,
        });
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Payment failed or was cancelled');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Expand Voter Capacity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly lift voter enrollment limits for <span className="text-slate-200 font-medium">“{electionTitle}”</span>
            </p>
          </div>
        </div>

        {/* Status context banner */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Current Status</p>
              <p className="text-sm font-semibold text-white">
                {currentVoterCount} enrolled / {currentLimit} max capacity
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">New Capacity</p>
            <p className="text-sm font-bold text-emerald-400">
              {newCapacity} voters
            </p>
          </div>
        </div>

        {/* Booster Selection Grid */}
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Select Capacity Pack
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {boosterList.map((booster) => {
            const isSelected = selectedSlug === booster.slug;
            return (
              <button
                key={booster.slug}
                type="button"
                onClick={() => setSelectedSlug(booster.slug)}
                className={`flex flex-col p-4 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10 text-white'
                    : 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600 text-slate-300'
                }`}
              >
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 absolute top-3 right-3" />
                )}
                <span className="text-xs font-semibold text-slate-400 mb-1">
                  +{booster.additionalVoters} Voters
                </span>
                <span className="text-lg font-bold text-white mb-2">
                  {formatPriceInr(booster.price)}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  One-time single election boost
                </span>
              </button>
            );
          })}
        </div>

        {/* Optional GSTIN Input */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>GSTIN for Tax Invoice (Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 29AAAAA0000A1Z5"
            value={customerGstin}
            onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
            maxLength={15}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Official GST tax invoice (SAC 998313, 18% GST) will be generated instantly.
          </p>
        </div>

        {/* Error or Success notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePurchase}
            disabled={loading || !isLoaded}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pay {formatPriceInr(selectedBooster.price)}</span>
              </>
            )}
          </button>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured by Razorpay. 256-bit SSL encryption. Ballot secrecy preserved.</span>
        </div>
      </div>
    </div>
  );
}

