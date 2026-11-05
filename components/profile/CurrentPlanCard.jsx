'use client';

import Link from 'next/link';
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  ExternalLink,
  Lock,
  AlertCircle,
  Building2,
  Clock,
  Zap,
} from 'lucide-react';

/**
 * CurrentPlanCard
 * Renders a comprehensive, production-ready subscription and entitlement overview
 * for the user's active organization on their profile page.
 */
export default function CurrentPlanCard({
  currentSubscription,
  userOrganizations = [],
  selectedOrgId,
  onSelectOrg,
}) {
  if (!currentSubscription || !currentSubscription.organization) {
    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Workspace Plan & Subscription</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Current tier allowances, voter capacity, and quota meters</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <Building2 className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Organization Workspace Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Subscriptions and election limits in VoteSphere belong to organizations. Create your first workspace to unlock institutional voting tiers.
          </p>
          <div className="pt-2">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Create an Organization</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { organization, plan, subscription, usage, canManageBilling, userRole } = currentSubscription;

  const isFree = plan.slug === 'free' || plan.planType === 'free';
  const isOneTime = plan.planType === 'one_time' || plan.slug === 'event-pass';
  const isEnterprise = plan.slug === 'enterprise';
  const isAnnual = plan.billingInterval === 'yearly' || plan.billingInterval === 'annual';

  // Subscription Lifecycle Status Badge Styling
  const getStatusBadge = () => {
    if (isFree) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span>Free Tier</span>
        </span>
      );
    }

    const status = subscription?.status || 'active';
    if (subscription?.isGracePeriod) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          <span>Grace Period</span>
        </span>
      );
    }

    switch (status) {
      case 'active':
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Active</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>Pending Renewal</span>
          </span>
        );
      case 'cancelled':
      case 'halted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  // Plan Type description
  const getSubscriptionTypeLabel = () => {
    if (isFree) return 'Community Free Tier (Forever)';
    if (isOneTime) return 'One-Time 30-Day Electoral Pass';
    if (isEnterprise) return 'Custom Enterprise Contract';
    if (isAnnual) return 'Annual Subscription (12 Months)';
    return 'Monthly Subscription';
  };

  // Renewal / Expiry date formatting
  const getRenewalDateDisplay = () => {
    if (isFree) return 'Never (Free Forever)';
    if (subscription?.currentPeriodEnd) {
      const dateStr = new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return isOneTime ? `Pass Expires: ${dateStr}` : `Renews: ${dateStr}`;
    }
    return 'Active';
  };

  // Usage meters
  const monthlyAllowance = usage?.monthlyElectionAllowance || plan.monthlyElectionAllowance || 2;
  const monthlyUsed = usage?.monthlyElectionsUsed || 0;
  const monthlyRemaining = Math.max(0, monthlyAllowance - monthlyUsed);
  const monthlyPct = Math.min(100, Math.round((monthlyUsed / monthlyAllowance) * 100));

  const liveAllowance = usage?.simultaneousLiveElections || plan.simultaneousLiveElections || 1;
  const liveUsed = usage?.liveElectionsUsed || 0;
  const livePct = Math.min(100, Math.round((liveUsed / liveAllowance) * 100));

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 sm:p-7 shadow-xl space-y-6">
      {/* Card Header & Workspace Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Workspace Plan & Subscription</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Commercial voting quotas and tier entitlements
            </p>
          </div>
        </div>

        {/* Workspace Switcher (if user belongs to multiple orgs) */}
        {userOrganizations.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              Workspace:
            </span>
            <select
              value={selectedOrgId || organization.id}
              onChange={(e) => onSelectOrg && onSelectOrg(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {userOrganizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.isOwner ? '(Owner)' : `(${o.userRole})`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Plan Overview Banner */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {plan.name}
            </h3>
            {getStatusBadge()}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {organization.name}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {getSubscriptionTypeLabel()}
          </p>
        </div>

        <div className="flex items-baseline gap-1 md:text-right">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {plan.formattedPrice}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isFree ? 'forever' : isOneTime ? '/30-day pass' : isAnnual ? '/year' : '/month'}
          </span>
        </div>
      </div>

      {/* Usage Progress Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Metric 1: Monthly Election Allowance */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Monthly Election Allowance
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {monthlyUsed} / {monthlyAllowance} used
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${monthlyPct}%` }}
              className={`h-full transition-all duration-500 ${
                monthlyPct >= 90 ? 'bg-rose-500' : monthlyPct >= 70 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{monthlyRemaining} election{monthlyRemaining === 1 ? '' : 's'} remaining this calendar month</span>
            <span>{monthlyPct}%</span>
          </p>
        </div>

        {/* Metric 2: Concurrent Live Elections */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Simultaneous Live Elections
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {liveUsed} / {liveAllowance} active
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${livePct}%` }}
              className={`h-full transition-all duration-500 ${
                livePct >= 100 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Concurrent running polls capacity</span>
            <span>{livePct}%</span>
          </p>
        </div>
      </div>

      {/* Subscription Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Voter Capacity
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
            {plan.voterLimitPerElection?.toLocaleString('en-IN') || 50} per election
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Billing Interval
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block capitalize">
            {isFree ? 'Free Forever' : isOneTime ? '30-Day Pass' : plan.billingInterval || 'Monthly'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Renewal / Expiry
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
            {getRenewalDateDisplay()}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Billing Ownership
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block capitalize">
            {canManageBilling ? 'You (Owner)' : `Role: ${userRole}`}
          </span>
        </div>
      </div>

      {/* Premium Features Included Checklist */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Plan Entitlements & Features
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Zero-Knowledge Ballots</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
            {plan.features?.runoff ? (
              <Check className="w-4 h-4 text-blue-500 shrink-0" />
            ) : (
              <span className="w-4 h-4 text-slate-400 text-center font-bold shrink-0">—</span>
            )}
            <span className={plan.features?.runoff ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 line-through'}>
              Automated Runoff Engine
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
            {plan.features?.customBranding ? (
              <Check className="w-4 h-4 text-purple-500 shrink-0" />
            ) : (
              <span className="w-4 h-4 text-slate-400 text-center font-bold shrink-0">—</span>
            )}
            <span className={plan.features?.customBranding ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 line-through'}>
              Custom Crest & Branding
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
            {isEnterprise ? (
              <Check className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <span className="w-4 h-4 text-slate-400 text-center font-bold shrink-0">—</span>
            )}
            <span className={isEnterprise ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 line-through'}>
              24/7 Dedicated Support
            </span>
          </div>
        </div>
      </div>

      {/* Non-Owner RBAC Advisory (if viewing as admin or voter) */}
      {!canManageBilling && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            You have <strong>{userRole}</strong> permissions for <strong>{organization.name}</strong>. Only the organization owner can authorize commercial upgrades, payment mandates, and billing invoice downloads.
          </span>
        </div>
      )}

      {/* CTA Navigation Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          {canManageBilling && !isEnterprise && (
            <Link
              href={`/pricing?orgId=${organization.id}&currentPlan=${plan.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{isFree ? 'Upgrade to Paid Plan' : 'Change / Upgrade Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {isEnterprise && (
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition-all"
            >
              <span>Contact Enterprise Sales</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            href={`/pricing?orgId=${organization.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span>View All Plans</span>
          </Link>
        </div>

        {canManageBilling && (
          <Link
            href={`/org/${organization.id}/billing`}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
          >
            <span>Manage Billing & GST Invoices</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
