/* eslint-disable no-console */
import { Resend } from 'resend';
import { AppError } from '../utils/error-handler.js';

/**
 * Custom Error for Email Delivery Failures
 */
export class EmailDeliveryError extends AppError {
  constructor(message = 'Email delivery failed', statusCode = 500, details = null) {
    super(message, statusCode, details);
    this.name = 'EmailDeliveryError';
  }
}

/**
 * Mask an email address for safe operational logging (e.g. j***e@domain.com)
 *
 * @param {string} email
 * @returns {string}
 */
export function maskEmail(email = '') {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'invalid-email';
  }
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * HTML Escaping utility to prevent XSS / HTML injection in transactional email templates.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str = '') {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Simple HTML to Plain Text converter for email clients that do not render HTML.
 *
 * @param {string} html
 * @returns {string}
 */
export function htmlToPlainText(html = '') {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

/**
 * Server-only Resend Email Dispatcher.
 *
 * @param {object} params
 * @param {string | string[]} params.to - Recipient email address(es)
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - Valid HTML email body
 * @param {string} [params.text] - Plain text fallback
 * @param {string} [params.replyTo] - Reply-To email address
 * @param {string} [params.from] - Sender address override (must match verified domain)
 * @param {string} [params.eventType='transactional_email'] - Identifier for audit logging
 * @returns {Promise<{ success: boolean, id?: string, deliveryDisabled?: boolean, error?: string }>}
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  from,
  eventType = 'transactional_email',
}) {
  // 1. Check feature flag: Real email delivery only. No mock success.
  const explicitFlag = process.env.EMAIL_DELIVERY_ENABLED;
  const apiKey = process.env.RESEND_API_KEY;
  const hasValidApiKey = Boolean(
    apiKey &&
    !apiKey.startsWith('re_YOUR_') &&
    !apiKey.startsWith('re_xxxx') &&
    apiKey.trim() !== ''
  );

  // Delivery is enabled if explicitly true, OR if valid API key is present and not explicitly false
  const isDeliveryEnabled =
    explicitFlag === 'true' || (explicitFlag !== 'false' && hasValidApiKey);

  if (!isDeliveryEnabled || !hasValidApiKey) {
    if (process.env.NODE_ENV === 'development') {
      const target = Array.isArray(to) ? to.map(maskEmail).join(', ') : maskEmail(to);
      console.log(`[Email Notice] Delivery is disabled (EMAIL_DELIVERY_ENABLED=${explicitFlag}, hasApiKey=${hasValidApiKey}). Skipped event "${eventType}" to [${target}].`);
    }
    return {
      success: false,
      deliveryDisabled: true,
      error: 'Email delivery is currently disabled or Resend API key is not configured.',
    };
  }

  // 2. Sender and Reply-To defaults
  // Use custom verified RESEND_FROM_EMAIL if configured, otherwise fallback to Resend's default onboarding sender
  let fromAddress = from || process.env.RESEND_FROM_EMAIL;
  if (!fromAddress || fromAddress.includes('noreply@votesphere.org') || fromAddress.includes('YOUR_VERIFIED_DOMAIN')) {
    fromAddress = 'VoteSphere <onboarding@resend.dev>';
  }

  const replyToAddress =
    replyTo || process.env.RESEND_REPLY_TO_EMAIL || undefined;

  const recipients = Array.isArray(to) ? to : [to];
  const plainText = text || htmlToPlainText(html);

  try {
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      subject,
      html,
      text: plainText,
      reply_to: replyToAddress,
    });

    if (result.error) {
      console.error(`[Email Failed] Event "${eventType}" failed:`, result.error.message || result.error);
      return {
        success: false,
        error: result.error.message || 'Email delivery failed',
      };
    }

    if (process.env.NODE_ENV === 'development') {
      const maskedList = recipients.map(maskEmail).join(', ');
      console.log(`[Email Success] Dispatched "${eventType}" to [${maskedList}] (ID: ${result.data?.id})`);
    }

    return {
      success: true,
      id: result.data?.id,
    };
  } catch (err) {
    console.error(`[Email Exception] Error dispatching event "${eventType}":`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}
