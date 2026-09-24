import { contactSubmissionSchema } from '@/lib/validations';
import { sendEmail, escapeHtml } from '@/lib/email/client';
import { rateLimiter, getClientIp } from '@/lib/security/rate-limiter';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { handleApiError, TooManyRequestsError, ValidationError } from '@/lib/utils/error-handler';

/**
 * POST /api/contact
 * Handles public live contact form submissions via Resend transactional email.
 */
export async function POST(request) {
  try {
    const clientIp = getClientIp(request, 'anonymous');

    // 1. Abuse Protection: Limit to 5 submissions per 15 minutes per IP
    const rateCheck = rateLimiter.check(`contact:${clientIp}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateCheck.allowed && process.env.NODE_ENV !== 'test') {
      throw new TooManyRequestsError(
        'Too many contact inquiries. Please wait a few minutes before submitting again.',
        Math.ceil(rateCheck.resetMs / 1000)
      );
    }

    // 2. Parse & Validate Payload
    const rawBody = await request.json();
    const validatedData = contactSubmissionSchema.parse(rawBody);

    // 3. Honeypot check: If the hidden bot field is filled, reject
    if (validatedData.honeypot && validatedData.honeypot.trim() !== '') {
      throw new ValidationError('Bot submission detected.');
    }

    // 4. Determine authoritative recipient email
    const recipientEmail =
      process.env.CONTACT_RECIPIENT_EMAIL ||
      process.env.RESEND_REPLY_TO_EMAIL ||
      'support@votesphere.org';

    // 5. Build Safe HTML and Plain Text Templates
    const safeName = escapeHtml(validatedData.name);
    const safeEmail = escapeHtml(validatedData.email);
    const safeSubject = escapeHtml(validatedData.subject);
    const safeCategory = escapeHtml(validatedData.category);
    const safeOrg = validatedData.organization
      ? escapeHtml(validatedData.organization)
      : 'None provided';
    const safeMessage = escapeHtml(validatedData.message).replace(/\n/g, '<br>');
    const timestamp = new Date().toUTCString();
    const environment = process.env.NODE_ENV || 'development';

    const emailSubject = `[VoteSphere Contact] ${validatedData.category} — ${validatedData.subject}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
            .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 20px; }
            .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .title { font-size: 18px; font-weight: 700; margin: 12px 0 4px; color: #0f172a; }
            .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; line-height: 1.6; }
            .message-box { background: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; color: #334155; margin: 20px 0; }
            .footer { font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <span class="badge">${safeCategory}</span>
              <h2 class="title">${safeSubject}</h2>
            </div>
            <div class="meta">
              <strong>Sender:</strong> ${safeName} (&lt;${safeEmail}&gt;)<br>
              <strong>Organization:</strong> ${safeOrg}<br>
              <strong>Date:</strong> ${timestamp}<br>
              <strong>Environment:</strong> ${environment}
            </div>
            <div class="message-box">
              ${safeMessage}
            </div>
            <div class="footer">
              This is a live inquiry submitted through the VoteSphere public contact form. Reply directly to this email to contact ${safeName}.
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
[VoteSphere Contact Form Submission]
Category: ${validatedData.category}
Subject: ${validatedData.subject}
Sender: ${validatedData.name} <${validatedData.email}>
Organization: ${validatedData.organization || 'None'}
Timestamp: ${timestamp}
Environment: ${environment}

Message:
${validatedData.message}
    `.trim();

    // 6. Dispatch via Resend Client
    const dispatchResult = await sendEmail({
      to: recipientEmail,
      replyTo: validatedData.email,
      subject: emailSubject,
      html: htmlBody,
      text: textBody,
      eventType: 'contact_form_submission',
    });

    if (dispatchResult.deliveryDisabled) {
      return errorResponse(
        'Email delivery is currently disabled in this environment (EMAIL_DELIVERY_ENABLED=false). In production, configure verified Resend credentials to receive inquiries.',
        503,
        { deliveryDisabled: true }
      );
    }

    if (!dispatchResult.success) {
      return errorResponse(
        'Unable to transmit message at this moment. Please try again later.',
        500
      );
    }

    return successResponse(
      {
        messageId: dispatchResult.id,
      },
      'Your message has been sent. Our team will reply to the email address you provided.',
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
