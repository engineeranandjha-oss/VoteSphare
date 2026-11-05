/**
 * VoteSphere Static Pricing & Plan Specifications
 * 
 * Defines canonical tier configurations, pricing (denominated in paise for Razorpay),
 * monthly allowances, voter capacity caps, feature flags, and capacity boosters.
 */

export const PLANS_CONFIG = Object.freeze({
  free: Object.freeze({
    id: 'free',
    slug: 'free',
    name: 'Community (Free)',
    description: 'Essential democratic voting for student clubs, family polls, and small teams.',
    planType: 'free',
    billingInterval: 'monthly',
    price: 0, // In paise
    currency: 'INR',
    monthlyElectionAllowance: 2,
    voterLimitPerElection: 50,
    simultaneousLiveElections: 1,
    features: Object.freeze({
      runoff: false,
      customBranding: false,
      prioritySupport: false,
      bulkEmail: false,
      auditExport: false,
      certifiedPdf: false,
    }),
    sortOrder: 1,
    isActive: true,
  }),

  'event-pass': Object.freeze({
    id: 'event-pass',
    slug: 'event-pass',
    name: 'Event Pass (One-Time)',
    description: '30-day complete pass for annual AGM elections, residential societies (RWA), and clubs.',
    planType: 'one_time',
    billingInterval: 'once',
    price: 299900, // ₹2,999 in paise
    currency: 'INR',
    validityDays: 30,
    monthlyElectionAllowance: 1,
    voterLimitPerElection: 500,
    simultaneousLiveElections: 1,
    features: Object.freeze({
      runoff: true,
      customBranding: true,
      prioritySupport: false,
      bulkEmail: true,
      auditExport: true,
      certifiedPdf: true,
    }),
    sortOrder: 2,
    isActive: true,
  }),

  'starter-monthly': Object.freeze({
    id: 'starter-monthly',
    slug: 'starter-monthly',
    name: 'Starter (Monthly)',
    description: 'For coaching institutes, high schools, academic departments, and growing non-profits.',
    planType: 'recurring',
    billingInterval: 'monthly',
    price: 149900, // ₹1,499 in paise
    currency: 'INR',
    monthlyElectionAllowance: 5,
    voterLimitPerElection: 250,
    simultaneousLiveElections: 2,
    features: Object.freeze({
      runoff: false,
      customBranding: false,
      prioritySupport: false,
      bulkEmail: true,
      auditExport: false,
      certifiedPdf: true,
    }),
    sortOrder: 3,
    isActive: true,
  }),

  'starter-annual': Object.freeze({
    id: 'starter-annual',
    slug: 'starter-annual',
    name: 'Starter (Annual)',
    description: 'Annual commitment with 2 months free for schools and recurring student societies.',
    planType: 'recurring',
    billingInterval: 'yearly',
    price: 1499000, // ₹14,990 in paise (Save ~17%)
    currency: 'INR',
    monthlyElectionAllowance: 5,
    voterLimitPerElection: 250,
    simultaneousLiveElections: 2,
    features: Object.freeze({
      runoff: false,
      customBranding: false,
      prioritySupport: false,
      bulkEmail: true,
      auditExport: false,
      certifiedPdf: true,
    }),
    sortOrder: 4,
    isActive: true,
  }),

  'pro-monthly': Object.freeze({
    id: 'pro-monthly',
    slug: 'pro-monthly',
    name: 'Professional (Monthly)',
    description: 'Full-featured voting engine with automated runoffs and custom branding for universities and companies.',
    planType: 'recurring',
    billingInterval: 'monthly',
    price: 499900, // ₹4,999 in paise
    currency: 'INR',
    monthlyElectionAllowance: 20,
    voterLimitPerElection: 1500,
    simultaneousLiveElections: 5,
    features: Object.freeze({
      runoff: true,
      customBranding: true,
      prioritySupport: true,
      bulkEmail: true,
      auditExport: true,
      certifiedPdf: true,
    }),
    sortOrder: 5,
    isActive: true,
  }),

  'pro-annual': Object.freeze({
    id: 'pro-annual',
    slug: 'pro-annual',
    name: 'Professional (Annual)',
    description: 'Annual institutional deployment with dedicated priority queue and 2 months free.',
    planType: 'recurring',
    billingInterval: 'yearly',
    price: 4999000, // ₹49,990 in paise (Save ~17%)
    currency: 'INR',
    monthlyElectionAllowance: 20,
    voterLimitPerElection: 1500,
    simultaneousLiveElections: 5,
    features: Object.freeze({
      runoff: true,
      customBranding: true,
      prioritySupport: true,
      bulkEmail: true,
      auditExport: true,
      certifiedPdf: true,
    }),
    sortOrder: 6,
    isActive: true,
  }),

  enterprise: Object.freeze({
    id: 'enterprise',
    slug: 'enterprise',
    name: 'Enterprise (Annual)',
    description: 'Tailored for large universities (10K+ voters), bar associations, and enterprise HR compliance.',
    planType: 'recurring',
    billingInterval: 'yearly',
    price: 14999000, // ₹1,49,990 in paise
    currency: 'INR',
    monthlyElectionAllowance: 9999,
    voterLimitPerElection: 10000,
    simultaneousLiveElections: 999,
    features: Object.freeze({
      runoff: true,
      customBranding: true,
      prioritySupport: true,
      bulkEmail: true,
      auditExport: true,
      certifiedPdf: true,
      dedicatedAccountManager: true,
      sso: true,
    }),
    sortOrder: 7,
    isActive: true,
  }),
});

/**
 * Capacity Booster Add-on Packs
 * Purchased via one-time Razorpay orders to temporarily lift voter limits for an election.
 */
export const VOTER_BOOSTER_PACKS = Object.freeze({
  'booster-250': Object.freeze({
    id: 'booster-250',
    slug: 'booster-250',
    name: '+250 Voter Capacity Booster',
    additionalVoters: 250,
    price: 79900, // ₹799 in paise
    currency: 'INR',
  }),
  'booster-500': Object.freeze({
    id: 'booster-500',
    slug: 'booster-500',
    name: '+500 Voter Capacity Booster',
    additionalVoters: 500,
    price: 129900, // ₹1,299 in paise
    currency: 'INR',
  }),
  'booster-1500': Object.freeze({
    id: 'booster-1500',
    slug: 'booster-1500',
    name: '+1,500 Voter Capacity Booster',
    additionalVoters: 1500,
    price: 299900, // ₹2,999 in paise
    currency: 'INR',
  }),
});

/**
 * Retrieve a plan configuration by its slug identifier.
 * Defaults to 'free' if invalid or unknown slug provided.
 *
 * @param {string} slug
 * @returns {typeof PLANS_CONFIG.free}
 */
export function getPlanBySlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return PLANS_CONFIG.free;
  }
  return PLANS_CONFIG[slug.toLowerCase().trim()] || PLANS_CONFIG.free;
}

/**
 * Retrieve a voter capacity booster by its slug.
 *
 * @param {string} slug
 * @returns {typeof VOTER_BOOSTER_PACKS['booster-250'] | null}
 */
export function getBoosterPackBySlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return null;
  }
  return VOTER_BOOSTER_PACKS[slug.toLowerCase().trim()] || null;
}

/**
 * Returns all active plans sorted by sortOrder.
 *
 * @returns {Array<typeof PLANS_CONFIG.free>}
 */
export function getAllActivePlans() {
  return Object.values(PLANS_CONFIG)
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Converts price in paise to a localized Indian Rupee (₹) currency string.
 * e.g. 499900 -> "₹4,999"
 *
 * @param {number} paise
 * @param {boolean} [includeDecimals=false]
 * @returns {string}
 */
export function formatPriceInr(paise = 0, includeDecimals = false) {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

