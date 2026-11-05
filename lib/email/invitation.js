/* eslint-disable no-console */
import crypto from 'crypto';

const SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'votesphere-invite-secret-key';

/**
 * Generates a signed, URL-safe invitation token.
 *
 * @param {{ orgId: string, email: string, role?: string, expiresInDays?: number }} params
 * @returns {string} Signed token
 */
export function generateInviteToken({ orgId, email, role = 'voter', expiresInDays = 7 }) {
  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({
    orgId,
    email: email.toLowerCase().trim(),
    role,
    expiresAt,
  });

  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');

  return `${base64Payload}.${signature}`;
}

/**
 * Verifies and decodes a signed invitation token.
 *
 * @param {string} token
 * @returns {{ valid: boolean, data?: { orgId: string, email: string, role: string, expiresAt: number }, error?: string }}
 */
export function verifyInviteToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Invalid token format' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed invitation token' };
  }

  const [base64Payload, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf-8'));

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Invitation link has expired' };
    }

    return { valid: true, data: payload };
  } catch {
    return { valid: false, error: 'Failed to decode token payload' };
  }
}

import { sendEmail } from './client.js';

/**
 * Dispatches an invitation email using the centralized Resend client.
 *
 * @param {{ email: string, orgName: string, inviterName: string, role: string, inviteLink: string }} params
 */
export async function sendInvitationEmail({ email, orgName, inviterName, role, inviteLink }) {
  const subject = `You've been invited to join ${orgName} on VoteSphere`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 40px 20px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px; }
          .header { text-align: center; margin-bottom: 28px; }
          .logo { font-size: 24px; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px; }
          .title { font-size: 20px; font-weight: 700; margin: 16px 0 8px; color: #ffffff; }
          .message { font-size: 15px; line-height: 1.6; color: #9ca3af; margin-bottom: 28px; }
          .badge { display: inline-block; padding: 4px 10px; background-color: #1e3a8a; color: #93c5fd; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; }
          .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #1f2937; font-size: 12px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VoteSphere</div>
            <h1 class="title">Organization Invitation</h1>
          </div>
          <div style="text-align: center;">
            <div class="badge">Role: ${role}</div>
          </div>
          <p class="message">
            Hello,<br><br>
            <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on VoteSphere as an <strong>${role}</strong>.
            VoteSphere is a secure, anonymous voting platform for organizations.
          </p>
          <div class="btn-container">
            <a href="${inviteLink}" class="btn">Accept Invitation</a>
          </div>
          <p class="message" style="font-size: 13px; color: #6b7280;">
            Or copy and paste this URL into your browser:<br>
            <a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>
          </p>
          <div class="footer">
            This invitation link will expire in 7 days. If you did not expect this invitation, you can ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    eventType: 'organization_invitation',
  });
}

