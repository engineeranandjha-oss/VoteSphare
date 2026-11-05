/**
 * VoteSphere Subscription Lifecycle State Machine & Transition Rules
 *
 * Governs permissible state transitions across recurring subscriptions,
 * grace period validity evaluation, and badge representation.
 */

export const SUBSCRIPTION_STATUSES = Object.freeze({
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PENDING: 'pending',
  HALTED: 'halted',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
});

export const GRACE_PERIOD_DAYS = 7;

/**
 * Permissible state transitions for OrganizationSubscription.status
 */
export const ALLOWED_SUBSCRIPTION_TRANSITIONS = Object.freeze({
  trialing: Object.freeze(['active', 'cancelled', 'expired']),
  active: Object.freeze(['pending', 'halted', 'cancelled', 'completed', 'expired']),
  pending: Object.freeze(['active', 'halted', 'cancelled', 'expired']),
  halted: Object.freeze(['active', 'cancelled', 'expired']),
  cancelled: Object.freeze(['active', 'expired']),
  completed: Object.freeze(['active', 'expired']),
  expired: Object.freeze(['active']),
});

/**
 * Check if a subscription state transition is permissible.
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
export function canTransitionSubscription(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) return false;
  if (currentStatus === newStatus) return true;

  const allowed = ALLOWED_SUBSCRIPTION_TRANSITIONS[currentStatus.toLowerCase()];
  if (!allowed) return false;

  return allowed.includes(newStatus.toLowerCase());
}

/**
 * Evaluates whether an organization subscription is operational
 * (i.e., entitled to its plan quotas).
 *
 * An organization is operational if:
 * 1. Status is 'active' or 'trialing'.
 * 2. Status is 'pending', but the 7-day grace period has not expired.
 *
 * @param {string} status
 * @param {Date|string|null} [gracePeriodEnd]
 * @returns {boolean}
 */
export function isSubscriptionOperational(status, gracePeriodEnd = null) {
  if (!status) return false;
  const s = status.toLowerCase();

  if (s === SUBSCRIPTION_STATUSES.ACTIVE || s === SUBSCRIPTION_STATUSES.TRIALING) {
    return true;
  }

  if (s === SUBSCRIPTION_STATUSES.PENDING) {
    if (!gracePeriodEnd) {
      return true; // Pending without explicit end date defaults to active within grace
    }
    const end = new Date(gracePeriodEnd);
    return !Number.isNaN(end.getTime()) && new Date() <= end;
  }

  return false;
}

/**
 * Computes a standard grace period expiration timestamp (now + 7 days).
 *
 * @param {Date|string} [baseDate=new Date()]
 * @param {number} [days=GRACE_PERIOD_DAYS]
 * @returns {Date}
 */
export function computeGracePeriodEnd(baseDate = new Date(), days = GRACE_PERIOD_DAYS) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * UI Metadata for subscription status badges.
 *
 * @param {string} status
 * @returns {{ label: string, variant: string, color: string, description: string }}
 */
export function getSubscriptionStatusBadge(status) {
  const s = (status || '').toLowerCase();

  switch (s) {
    case SUBSCRIPTION_STATUSES.ACTIVE:
      return {
        label: 'Active',
        variant: 'success',
        color: 'emerald',
        description: 'Plan is active and renewing automatically.',
      };
    case SUBSCRIPTION_STATUSES.TRIALING:
      return {
        label: 'Free Trial',
        variant: 'info',
        color: 'blue',
        description: 'Exploring full tier capabilities in trial period.',
      };
    case SUBSCRIPTION_STATUSES.PENDING:
      return {
        label: 'Payment Pending',
        variant: 'warning',
        color: 'amber',
        description: 'Renewal payment failed. 7-day grace period active.',
      };
    case SUBSCRIPTION_STATUSES.HALTED:
      return {
        label: 'Halted',
        variant: 'destructive',
        color: 'rose',
        description: 'Payment retries exhausted. Plan downgraded to Free.',
      };
    case SUBSCRIPTION_STATUSES.CANCELLED:
      return {
        label: 'Cancelled',
        variant: 'muted',
        color: 'slate',
        description: 'Subscription will not renew at the end of billing cycle.',
      };
    case SUBSCRIPTION_STATUSES.COMPLETED:
      return {
        label: 'Completed',
        variant: 'muted',
        color: 'indigo',
        description: 'All agreed subscription cycles completed.',
      };
    case SUBSCRIPTION_STATUSES.EXPIRED:
    default:
      return {
        label: 'Expired',
        variant: 'muted',
        color: 'slate',
        description: 'Subscription has expired.',
      };
  }
}

