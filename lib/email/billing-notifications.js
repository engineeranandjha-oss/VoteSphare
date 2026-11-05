import { sendEmail, escapeHtml } from './client.js';
import { formatPriceInr } from '../billing/plans-config.js';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://votesphere.org';

/**
 * Sends a subscription payment confirmation & tax receipt email.
 *
 * @param {Object} params
 * @param {string} params.to - Organization owner email
 * @param {string} params.orgName - Organization name
 * @param {string} params.planName - Name of the activated subscription plan
 * @param {number} params.amountInPaise - Total amount charged in paise
 * @param {string} params.invoiceNumber - Sequential invoice number
 * @param {Date|string} params.periodEnd - Next renewal date
 * @returns {Promise<Object>}
 */
export async function sendSubscriptionSuccessEmail({
  to,
  orgName,
  planName,
  amountInPaise,
  invoiceNumber,
  periodEnd,
}) {
  const cleanOrgName = escapeHtml(orgName || 'Your Organization');
  const cleanPlanName = escapeHtml(planName || 'VoteSphere Plan');
  const cleanInvoiceNo = escapeHtml(invoiceNumber || 'N/A');
  const formattedAmount = formatPriceInr(amountInPaise || 0);
  const formattedRenewal = periodEnd ? new Date(periodEnd).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : 'Next Billing Cycle';

  const subject = `Payment Confirmed: ${cleanPlanName} for ${cleanOrgName} [${cleanInvoiceNo}]`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; background-color: #10b98120; color: #10b981; border: 1px solid #10b98140; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .title { font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 16px; margin-bottom: 8px; }
    .table { width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #1e293b50; border-radius: 12px; overflow: hidden; }
    .table td { padding: 12px 16px; border-bottom: 1px solid #334155; font-size: 14px; }
    .table tr:last-child td { border-bottom: none; }
    .label { color: #94a3b8; font-weight: 500; }
    .value { color: #ffffff; font-weight: 600; text-align: right; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; margin-top: 16px; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Payment Successful</span>
    <h1 class="title">Subscription Active</h1>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Thank you for powering transparent, democratic governance with VoteSphere. Your recurring subscription has been charged and your electoral quotas are unlocked.
    </p>

    <table class="table">
      <tr>
        <td class="label">Organization</td>
        <td class="value">${cleanOrgName}</td>
      </tr>
      <tr>
        <td class="label">Plan</td>
        <td class="value">${cleanPlanName}</td>
      </tr>
      <tr>
        <td class="label">Invoice Number</td>
        <td class="value">${cleanInvoiceNo}</td>
      </tr>
      <tr>
        <td class="label">Amount Paid</td>
        <td class="value" style="color: #38bdf8;">${formattedAmount}</td>
      </tr>
      <tr>
        <td class="label">Next Renewal Date</td>
        <td class="value">${formattedRenewal}</td>
      </tr>
    </table>

    <div style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="btn">Go to Organization Dashboard</a>
    </div>

    <div class="footer">
      VoteSphere Invoicing • SAC Code 998313 (IT & Cloud SaaS)<br>
      This is a system-generated tax confirmation receipt.
    </div>
  </div>
</body>
</html>
  `.trim();

  return await sendEmail({
    to,
    subject,
    html,
    eventType: 'billing_payment_success',
  });
}

/**
 * Sends a critical renewal failure & 7-day grace period warning email.
 *
 * @param {Object} params
 * @param {string} params.to - Organization owner email
 * @param {string} params.orgName - Organization name
 * @param {string} params.planName - Subscription plan name
 * @param {Date|string} params.gracePeriodEnd - End of the 7-day grace period
 * @returns {Promise<Object>}
 */
export async function sendPaymentFailedGracePeriodEmail({
  to,
  orgName,
  planName,
  gracePeriodEnd,
}) {
  const cleanOrgName = escapeHtml(orgName || 'Your Organization');
  const cleanPlanName = escapeHtml(planName || 'VoteSphere Plan');
  const formattedGraceEnd = gracePeriodEnd ? new Date(gracePeriodEnd).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : 'within 7 days';

  const subject = `⚠️ Action Required: Subscription Renewal Failed for ${cleanOrgName} (7-Day Grace Period)`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #7f1d1d; border-radius: 16px; padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; background-color: #ef444420; color: #ef4444; border: 1px solid #ef444440; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .title { font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 16px; margin-bottom: 8px; }
    .alert-box { background-color: #450a0a50; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #fca5a5; }
    .btn { display: inline-block; background-color: #ef4444; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; margin-top: 16px; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Payment Failed</span>
    <h1 class="title">7-Day Grace Period Activated</h1>
    
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
      We attempted to process the scheduled renewal for <strong>${cleanPlanName}</strong> on behalf of <strong>${cleanOrgName}</strong>, but your bank declined the transaction.
    </p>

    <div class="alert-box">
      <strong>VoteSphere Election Integrity Guarantee:</strong><br>
      To prevent disruption to ongoing democratic voting, <strong>all live and scheduled elections will remain online and accessible until ${formattedGraceEnd}</strong>.
      However, creating new elections or importing new voters is temporarily paused until payment is updated.
    </div>

    <div style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="btn">Update Payment Method</a>
    </div>

    <div class="footer">
      If payment is not reconciled by ${formattedGraceEnd}, the organization will safely fall back to the Free tier. Concluded elections and audit logs will never be deleted.
    </div>
  </div>
</body>
</html>
  `.trim();

  return await sendEmail({
    to,
    subject,
    html,
    eventType: 'billing_payment_failed_grace_period',
  });
}

/**
 * Sends a subscription cancellation confirmation email.
 *
 * @param {Object} params
 * @param {string} params.to - Organization owner email
 * @param {string} params.orgName - Organization name
 * @param {string} params.planName - Subscription plan name
 * @param {Date|string} params.effectiveUntil - Date access expires
 * @returns {Promise<Object>}
 */
export async function sendSubscriptionCancelledEmail({
  to,
  orgName,
  planName,
  effectiveUntil,
}) {
  const cleanOrgName = escapeHtml(orgName || 'Your Organization');
  const cleanPlanName = escapeHtml(planName || 'VoteSphere Plan');
  const formattedExpiry = effectiveUntil ? new Date(effectiveUntil).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : 'the end of your billing cycle';

  const subject = `Subscription Cancelled: ${cleanPlanName} for ${cleanOrgName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; background-color: #64748b20; color: #94a3b8; border: 1px solid #64748b40; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .title { font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 16px; margin-bottom: 8px; }
    .btn { display: inline-block; background-color: #3b82f6; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; margin-top: 16px; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Cancellation Confirmed</span>
    <h1 class="title">Subscription Cancellation</h1>
    
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Your subscription to <strong>${cleanPlanName}</strong> for <strong>${cleanOrgName}</strong> has been cancelled.
    </p>

    <p style="color: #f1f5f9; font-size: 14px; line-height: 1.6;">
      You will retain all features and benefits of your current plan until <strong>${formattedExpiry}</strong>. After this date, your organization will automatically transition to the Free plan.
    </p>

    <div style="background-color: #1e293b50; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #94a3b8;">
      🛡️ <strong>Historical Election Retention:</strong> All past elections, voter participation turnout records, ballots, and audit logs remain permanently accessible and will never be deleted.
    </div>

    <div style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="btn">View Organization</a>
    </div>

    <div class="footer">
      You can reactivate your subscription at any time from your Organization Billing settings.
    </div>
  </div>
</body>
</html>
  `.trim();

  return await sendEmail({
    to,
    subject,
    html,
    eventType: 'billing_subscription_cancelled',
  });
}

