'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import BillingIntervalToggle from '@/components/billing/BillingIntervalToggle';
import PricingCard from '@/components/billing/PricingCard';
import PlanComparisonTable from '@/components/billing/PlanComparisonTable';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  FileCheck2,
  Sparkles,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOrgId = searchParams.get('orgId') || null;
  const queryCurrentPlan = searchParams.get('currentPlan') || null;

  const { authenticated, user } = useAuth();
  const { openCheckout } = useRazorpay();

  const [interval, setInterval] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [activePlanSlug, setActivePlanSlug] = useState(null);
  const [currentOrgPlanSlug, setCurrentOrgPlanSlug] = useState(queryCurrentPlan);
  const [errorMessage, setErrorMessage] = useState(null);

  // Org Selection Modal State (when user has multiple orgs)
  const [userOrgs, setUserOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(preselectedOrgId);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  // 1. Fetch active plans from public catalog endpoint
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/billing/plans');
        const json = await res.json();
        if (res.ok && json.data?.plans) {
          setPlans(json.data.plans);
        }
      } catch {
        // Fallback handled gracefully by static fallback definitions
      }
    }
    fetchPlans();
  }, []);

  // 2. Fetch user organizations if authenticated
  useEffect(() => {
    if (authenticated) {
      fetch('/api/orgs')
        .then((res) => res.json())
        .then((json) => {
          if (json.data && Array.isArray(json.data)) {
            const eligibleOrgs = json.data.filter(
              (o) => o.userRole === 'owner' || o.userRole === 'admin'
            );
            setUserOrgs(eligibleOrgs);
            if (!preselectedOrgId && eligibleOrgs.length === 1) {
              setSelectedOrgId(eligibleOrgs[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [authenticated, preselectedOrgId]);

  // Fetch target organization billing telemetry if selected
  useEffect(() => {
    if (selectedOrgId && authenticated) {
      fetch(`/api/orgs/${selectedOrgId}/billing`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data?.plan?.slug) {
            setCurrentOrgPlanSlug(json.data.plan.slug);
            if (json.data.plan.billingInterval === 'yearly' || json.data.plan.billingInterval === 'annual') {
              setInterval('annual');
            }
          }
        })
        .catch(() => {});
    }
  }, [selectedOrgId, authenticated]);

  // 3. Initiate Subscription Checkout Handler
  const initiateSubscription = useCallback(
    async (plan, targetOrgId) => {
      try {
        setCheckoutLoading(true);
        setActivePlanSlug(plan.slug);
        setErrorMessage(null);

        // Step 1: Create subscription session on backend
        const res = await fetch('/api/billing/subscriptions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: targetOrgId,
            planSlug: plan.slug,
            customerNotify: 1,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Failed to initiate subscription session');
        }

        const { subscriptionId, keyId } = json.data;

        // Step 2: Open Razorpay checkout modal
        const response = await openCheckout({
          key: keyId,
          subscription_id: subscriptionId,
          name: 'VoteSphere',
          description: `${plan.name} Subscription`,
          image: '/logo.png',
          prefill: {
            email: user?.email || '',
            name: user?.name || '',
          },
          theme: {
            color: '#2563eb',
          },
        });

        // Step 3: Verify payment signature on backend
        const verifyRes = await fetch('/api/billing/subscriptions/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: targetOrgId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verifyJson = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyJson.message || 'Payment signature verification failed');
        }

        // Step 4: Redirect to success view
        router.push(
          `/billing/success?subId=${response.razorpay_subscription_id}&orgId=${targetOrgId}&plan=${plan.slug}`
        );
      } catch (err) {
        setErrorMessage(err.message || 'Checkout failed. Please try again.');
      } finally {
        setCheckoutLoading(false);
        setActivePlanSlug(null);
      }
    },
    [openCheckout, router, user]
  );

  // 4. Initiate One-Time Order Checkout Handler (Event Pass)
  const initiateOneTimeOrder = useCallback(
    async (plan, targetOrgId) => {
      try {
        setCheckoutLoading(true);
        setActivePlanSlug(plan.slug);
        setErrorMessage(null);

        const res = await fetch('/api/billing/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: targetOrgId,
            orderType: 'event_pass',
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Failed to initiate Event Pass order');
        }

        const { order } = json.data;

        const response = await openCheckout({
          key: order.keyId,
          order_id: order.id,
          name: 'VoteSphere',
          description: 'Event Pass (30-Day Complete Electoral Access)',
          image: '/logo.png',
          prefill: {
            email: user?.email || '',
            name: user?.name || '',
          },
          theme: {
            color: '#2563eb',
          },
        });

        const verifyRes = await fetch('/api/billing/orders/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: targetOrgId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verifyJson = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyJson.message || 'Order verification failed');
        }

        router.push(
          `/billing/success?orderId=${response.razorpay_order_id}&orgId=${targetOrgId}&plan=event-pass`
        );
      } catch (err) {
        setErrorMessage(err.message || 'Payment failed. Please try again.');
      } finally {
        setCheckoutLoading(false);
        setActivePlanSlug(null);
      }
    },
    [openCheckout, router, user]
  );

  function handleSelectPlan(plan) {
    if (plan.slug === 'free') {
      router.push(authenticated ? '/dashboard' : '/auth/signup');
      return;
    }

    if (plan.slug === 'enterprise') {
      router.push('/contact?subject=Enterprise%20Plan%20Inquiry');
      return;
    }

    if (!authenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/pricing?plan=${plan.slug}`)}`);
      return;
    }

    const handler = plan.planType === 'one_time' ? initiateOneTimeOrder : initiateSubscription;

    if (selectedOrgId) {
      handler(plan, selectedOrgId);
    } else if (userOrgs.length > 0) {
      setPendingPlan(plan);
      setOrgModalOpen(true);
    } else {
      router.push(`/onboarding?plan=${plan.slug}`);
    }
  }

  // Canonical plans resolution
  const freePlan = plans.find((p) => p.slug === 'free') || {
    slug: 'free',
    name: 'Community',
    description: 'For student clubs, informal societies, and community polls to experience secure voting.',
    formattedPrice: '₹0',
    monthlyElectionAllowance: 2,
    voterLimitPerElection: 50,
    simultaneousLiveElections: 1,
    features: { runoff: false, customBranding: false },
  };

  const eventPassPlan = plans.find((p) => p.slug === 'event-pass') || {
    slug: 'event-pass',
    name: 'Event Pass',
    planType: 'one_time',
    description: '30-day single election pass for annual AGM elections, residential societies, and clubs.',
    formattedPrice: '₹2,999',
    monthlyElectionAllowance: 1,
    voterLimitPerElection: 500,
    simultaneousLiveElections: 1,
    features: { runoff: true, customBranding: true },
  };

  const starterPlan =
    plans.find((p) => p.slug === (interval === 'annual' ? 'starter-annual' : 'starter-monthly')) || {
      slug: interval === 'annual' ? 'starter-annual' : 'starter-monthly',
      name: 'Starter',
      description: 'For coaching institutes, academic departments, colleges, and growing non-profits.',
      formattedPrice: interval === 'annual' ? '₹14,990' : '₹1,499',
      billingInterval: interval === 'annual' ? 'annual' : 'monthly',
      monthlyElectionAllowance: 5,
      voterLimitPerElection: 250,
      simultaneousLiveElections: 2,
      features: { runoff: false, customBranding: false },
    };

  const proPlan =
    plans.find((p) => p.slug === (interval === 'annual' ? 'pro-annual' : 'pro-monthly')) || {
      slug: interval === 'annual' ? 'pro-annual' : 'pro-monthly',
      name: 'Professional',
      description: 'For universities, state associations, professional councils, and mid-sized enterprises.',
      formattedPrice: interval === 'annual' ? '₹49,990' : '₹4,999',
      billingInterval: interval === 'annual' ? 'annual' : 'monthly',
      monthlyElectionAllowance: 20,
      voterLimitPerElection: 1500,
      simultaneousLiveElections: 5,
      features: { runoff: true, customBranding: true },
    };

  const enterprisePlan = plans.find((p) => p.slug === 'enterprise') || {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'For state student federations, nationwide bodies, and large multi-tenant corporations.',
    formattedPrice: 'From ₹14,999',
    monthlyElectionAllowance: 100,
    voterLimitPerElection: 10000,
    simultaneousLiveElections: 25,
    features: { runoff: true, customBranding: true },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white transition-colors">
      <PublicNavbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 space-y-16 sm:space-y-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fair, Transparent Democratic Pricing</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Institutional Voting Power for Every Scale
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            From university elections to residential welfare associations (RWA) and corporate boards, choose the electoral plan that matches your institutional governance needs.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="pt-4">
            <BillingIntervalToggle interval={interval} onChange={setInterval} />
          </div>
        </div>

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Pricing Cards Grid (All 5 Cards Aligned) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6 items-stretch pt-2">
          <PricingCard
            plan={freePlan}
            isCurrentPlan={authenticated && (currentOrgPlanSlug === 'free' || !currentOrgPlanSlug)}
            onSelect={handleSelectPlan}
            buttonLabel={authenticated ? 'Current Free Tier' : 'Get Started Free'}
            interval={interval}
          />

          <PricingCard
            plan={eventPassPlan}
            isCurrentPlan={currentOrgPlanSlug === 'event-pass'}
            onSelect={handleSelectPlan}
            buttonLabel="Get Event Pass"
            loading={checkoutLoading && activePlanSlug === eventPassPlan.slug}
            interval={interval}
          />

          <PricingCard
            plan={starterPlan}
            isCurrentPlan={currentOrgPlanSlug === starterPlan.slug || (currentOrgPlanSlug?.startsWith('starter') && ((interval === 'annual' && starterPlan.slug === 'starter-annual') || (interval === 'monthly' && starterPlan.slug === 'starter-monthly')))}
            onSelect={handleSelectPlan}
            buttonLabel={
              currentOrgPlanSlug?.startsWith('starter')
                ? 'Current Plan'
                : (currentOrgPlanSlug?.startsWith('pro') || currentOrgPlanSlug === 'enterprise')
                ? 'Switch to Starter'
                : 'Upgrade to Starter'
            }
            loading={checkoutLoading && activePlanSlug === starterPlan.slug}
            interval={interval}
          />

          <PricingCard
            plan={proPlan}
            isPopular={!currentOrgPlanSlug?.startsWith('pro')}
            isCurrentPlan={currentOrgPlanSlug === proPlan.slug || (currentOrgPlanSlug?.startsWith('pro') && ((interval === 'annual' && proPlan.slug === 'pro-annual') || (interval === 'monthly' && proPlan.slug === 'pro-monthly')))}
            onSelect={handleSelectPlan}
            buttonLabel={
              currentOrgPlanSlug?.startsWith('pro')
                ? 'Current Plan'
                : currentOrgPlanSlug === 'enterprise'
                ? 'Switch to Pro'
                : 'Upgrade to Pro'
            }
            loading={checkoutLoading && activePlanSlug === proPlan.slug}
            interval={interval}
          />

          <PricingCard
            plan={enterprisePlan}
            isCurrentPlan={currentOrgPlanSlug === 'enterprise'}
            onSelect={handleSelectPlan}
            buttonLabel={currentOrgPlanSlug === 'enterprise' ? 'Current Plan' : 'Contact Sales'}
            interval={interval}
          />
        </div>

        {/* Feature Comparison Matrix */}
        <PlanComparisonTable />

        {/* Trust & Compliance Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-2 shadow-sm transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Constitutional Ballot Secrecy</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Payments, tax invoices, and payer identities are permanently isolated from cryptographic ballot ledgers.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-2 shadow-sm transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">GST Invoicing & SAC 998313</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              All prices include transparent 18% GST. Download compliant B2B tax invoices with Input Tax Credit from your dashboard.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-2 shadow-sm transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">RBI e-Mandate Protection</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Initial 2-factor OTP authorization with advance notifications and a guaranteed 7-day grace period on renewal failures.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-6 pt-4">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Common questions about VoteSphere subscriptions, event passes, and billing.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-xs transition-colors">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                Can I purchase a single election without a recurring subscription?
              </h5>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! Our <strong>Event Pass (₹2,999)</strong> provides a complete 30-day window for organizations like residential societies (RWA), annual clubs, and alumni bodies that only conduct one major election per year. It includes automated runoff rounds, custom branding, and up to 500 voters.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-xs transition-colors">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                What happens if a subscription renewal payment fails?
              </h5>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Democratic voting must never be disrupted unexpectedly. Our <strong>7-Day Grace Period</strong> ensures that all ongoing live and scheduled elections continue running without interruption while the organization updates its payment mandate.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-xs transition-colors">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                Are displayed prices inclusive of taxes?
              </h5>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes, all displayed prices include 18% Goods and Services Tax (GST) under SAC code 998313 (IT & Cloud Application Services). Business customers can input their 15-digit GSTIN during checkout to receive official tax invoices for Input Tax Credit (ITC).
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-xs transition-colors">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                Will our past election results be deleted if we cancel?
              </h5>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Never. Under our permanent data preservation policy, all concluded election results, turnout metrics, cryptographic ledger receipts, and audit logs remain permanently accessible and downloadable forever, even after downgrading to the Free tier.
              </p>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />

      {/* Organization Selection Modal (for users with multiple organizations) */}
      {orgModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Select Workspace</h3>
              </div>
              <button
                type="button"
                onClick={() => setOrgModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Choose which organization workspace you would like to upgrade to{' '}
              <strong className="text-slate-900 dark:text-white">{pendingPlan?.name}</strong>:
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto mb-6 pr-1">
              {userOrgs.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setSelectedOrgId(o.id);
                    setOrgModalOpen(false);
                    if (pendingPlan) {
                      const handler =
                        pendingPlan.planType === 'one_time' ? initiateOneTimeOrder : initiateSubscription;
                      handler(pendingPlan, o.id);
                    }
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {o.name}
                    </h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      /org/{o.slug}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOrgModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500 flex items-center justify-center text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-500" />
          <span>Loading pricing options...</span>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
