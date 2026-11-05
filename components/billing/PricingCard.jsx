'use client';

import { Check, Sparkles, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PricingCard({
  plan,
  isPopular = false,
  isCurrentPlan = false,
  onSelect,
  loading = false,
  buttonLabel = 'Select Plan',
  interval = 'monthly',
}) {
  const isFree = plan.slug === 'free';
  const isEnterprise = plan.slug === 'enterprise';
  const isOneTime = plan.planType === 'one_time' || plan.slug === 'event-pass';
  const isAnnual = interval === 'annual' || plan.billingInterval === 'annual' || plan.billingInterval === 'yearly';

  // Format pricing subtitle and billing details
  const getBillingSuffix = () => {
    if (isFree) return 'forever';
    if (isOneTime) return 'one-time';
    if (isEnterprise) return '/month';
    if (isAnnual) return '/year';
    return '/month';
  };

  const getBillingDescription = () => {
    if (isFree) return 'Free forever • No card required';
    if (isOneTime) return 'Single election • Valid for 30 days';
    if (isEnterprise) return 'Tailored contract • Billed annually';
    if (isAnnual) {
      // Show monthly equivalent savings
      const equivalentMonthly = plan.slug.includes('starter') ? '₹1,249/mo' : '₹4,166/mo';
      return `${equivalentMonthly} equivalent • Save 17%`;
    }
    return 'Billed monthly • Cancel anytime';
  };

  return (
    <div
      className={`relative flex flex-col justify-between h-full rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
        isCurrentPlan
          ? 'bg-white dark:bg-slate-900/95 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 ring-1 ring-emerald-500/20'
          : isPopular
          ? 'bg-white dark:bg-slate-900/95 border-2 border-blue-500 shadow-2xl shadow-blue-500/15 ring-1 ring-blue-500/20'
          : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-lg dark:shadow-xl'
      } backdrop-blur-xl`}
    >
      {/* Current Plan Badge or Most Popular Badge */}
      {isCurrentPlan ? (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
          <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-md shadow-emerald-500/30 flex items-center gap-1.5 border border-emerald-400/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-200" />
            <span>Current Plan</span>
          </span>
        </div>
      ) : isPopular ? (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
          <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 flex items-center gap-1.5 border border-blue-400/40">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Most Popular</span>
          </span>
        </div>
      ) : null}

      {/* Top Header & Price Block */}
      <div>
        {/* Tier Header */}
        <div className="flex items-center justify-between gap-2 min-h-[28px] mb-1.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {plan.name?.replace(/\s*\((Monthly|Annual)\)/i, '')}
          </h3>
          {isOneTime && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 uppercase tracking-wider whitespace-nowrap">
              30-Day Pass
            </span>
          )}
          {isPopular && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 uppercase tracking-wider whitespace-nowrap">
              Recommended
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] line-clamp-2 leading-relaxed">
          {plan.description}
        </p>

        {/* Pricing Display */}
        <div className="pt-4 pb-4 my-3 border-y border-slate-100 dark:border-slate-800/80">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {plan.formattedPrice || '₹0'}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {getBillingSuffix()}
            </span>
          </div>

          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 min-h-[16px]">
            {getBillingDescription()}
          </p>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {isFree ? 'Zero setup fees' : 'Includes 18% GST • SAC 998313'}
          </p>
        </div>

        {/* Feature Checklist */}
        <div className="space-y-2.5 mb-6">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Plan Entitlements:
          </span>

          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2 leading-snug">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>{plan.monthlyElectionAllowance || 'Unlimited'}</strong> election(s)/mo
              </span>
            </li>

            <li className="flex items-start gap-2 leading-snug">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Up to <strong>{plan.voterLimitPerElection?.toLocaleString('en-IN') || 50}</strong> voters/election
              </span>
            </li>

            <li className="flex items-start gap-2 leading-snug">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>{plan.simultaneousLiveElections || 1}</strong> concurrent live election(s)
              </span>
            </li>

            {plan.features?.runoff ? (
              <li className="flex items-start gap-2 leading-snug text-blue-600 dark:text-blue-300 font-medium">
                <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Automated Runoff Engine</span>
              </li>
            ) : (
              <li className="flex items-start gap-2 leading-snug text-slate-400 dark:text-slate-500">
                <span className="w-4 h-4 text-slate-400 shrink-0 text-center font-bold mt-0.5">—</span>
                <span>No automated runoff</span>
              </li>
            )}

            {plan.features?.customBranding ? (
              <li className="flex items-start gap-2 leading-snug text-purple-600 dark:text-purple-300 font-medium">
                <Check className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0 mt-0.5" />
                <span>Custom Crest & Branding</span>
              </li>
            ) : (
              <li className="flex items-start gap-2 leading-snug text-slate-400 dark:text-slate-500">
                <span className="w-4 h-4 text-slate-400 shrink-0 text-center font-bold mt-0.5">—</span>
                <span>VoteSphere Watermark</span>
              </li>
            )}

            <li className="flex items-start gap-2 leading-snug">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Zero-Knowledge Ballot Secrecy</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action CTA Button */}
      <button
        type="button"
        onClick={() => !isCurrentPlan && onSelect(plan)}
        disabled={loading || isCurrentPlan}
        className={`w-full h-11 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-auto shrink-0 ${
          isCurrentPlan
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default shadow-none font-semibold'
            : isPopular
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 ring-1 ring-blue-400/30'
            : isFree
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700'
            : isEnterprise
            ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-800 dark:border-slate-700'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : isCurrentPlan ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Current Active Plan</span>
          </>
        ) : (
          <>
            <span>{buttonLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  );
}
