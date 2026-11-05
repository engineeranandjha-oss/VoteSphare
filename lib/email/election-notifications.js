/* eslint-disable no-console */
/**
 * VoteSphere Election Email Notification & Invitation Engine
 * Dispatches responsive HTML email invitations and certified results notifications.
 */

/**
 * Generate HTML email template for voter ballot invitations
 */
export function generateVoterInvitationHtml({
  electionTitle,
  orgName,
  voteUrl,
  startDate,
  endDate,
  customMessage = '',
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 32px 16px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 4px 12px; background-color: #1e3a8a; color: #93c5fd; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .title { font-size: 24px; font-weight: 800; margin: 16px 0 8px; color: #ffffff; letter-spacing: -0.025em; line-height: 1.25; }
          .org { font-size: 14px; color: #9ca3af; margin-bottom: 24px; }
          .custom-msg { background-color: #1e293b; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #e2e8f0; line-height: 1.6; margin-bottom: 24px; font-style: italic; }
          .timeline { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 28px; font-size: 13px; }
          .timeline-row { display: flex; justify-content: space-between; margin-bottom: 6px; color: #9ca3af; }
          .timeline-row:last-child { margin-bottom: 0; }
          .timeline-value { color: #f3f4f6; font-weight: 600; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4); }
          .privacy-notice { font-size: 12px; color: #10b981; text-align: center; margin-top: 16px; font-weight: 500; }
          .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #1f2937; font-size: 11px; color: #6b7280; text-align: center; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">Official Ballot Invitation</span>
            <h1 class="title">${electionTitle}</h1>
            <div class="org">Organized by <strong>${orgName}</strong></div>
          </div>

          ${
            customMessage
              ? `<div class="custom-msg">"${customMessage}"</div>`
              : ''
          }

          <div class="timeline">
            <div class="timeline-row">
              <span>Opens:</span>
              <span class="timeline-value">${startDate || 'Open Now'}</span>
            </div>
            <div class="timeline-row">
              <span>Closes:</span>
              <span class="timeline-value">${endDate || 'Upon conclusion'}</span>
            </div>
          </div>

          <div class="btn-container">
            <a href="${voteUrl}" class="btn">Enter Voting Booth 🗳️</a>
          </div>

          <div class="privacy-notice">
            🔒 100% Cryptographically Anonymous — Your vote cannot be linked to your identity
          </div>

          <div class="footer">
            You received this email because you are registered as an eligible elector for ${orgName}.<br>
            Powered by <strong>VoteSphere</strong> — Verifiable & Anonymous Online Voting Architecture.
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML email template for election reminders (for unvoted electors)
 */
export function generateElectionReminderHtml({
  electionTitle,
  orgName,
  voteUrl,
  startDate,
  endDate,
  customMessage = '',
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 32px 16px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 4px 12px; background-color: #7c2d12; color: #fdba74; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .title { font-size: 24px; font-weight: 800; margin: 16px 0 8px; color: #ffffff; letter-spacing: -0.025em; line-height: 1.25; }
          .org { font-size: 14px; color: #9ca3af; margin-bottom: 24px; }
          .custom-msg { background-color: #1e293b; border-left: 4px solid #f97316; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #e2e8f0; line-height: 1.6; margin-bottom: 24px; font-style: italic; }
          .timeline { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 28px; font-size: 13px; }
          .timeline-row { display: flex; justify-content: space-between; margin-bottom: 6px; color: #9ca3af; }
          .timeline-row:last-child { margin-bottom: 0; }
          .timeline-value { color: #f3f4f6; font-weight: 600; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #ea580c, #c2410c); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(234, 88, 12, 0.4); }
          .privacy-notice { font-size: 12px; color: #10b981; text-align: center; margin-top: 16px; font-weight: 500; }
          .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #1f2937; font-size: 11px; color: #6b7280; text-align: center; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">Voting Reminder ⏰</span>
            <h1 class="title">${electionTitle}</h1>
            <div class="org">Organized by <strong>${orgName}</strong></div>
          </div>

          <p style="font-size: 14px; color: #d1d5db; line-height: 1.6; text-align: center;">
            This is a friendly reminder that voting is currently active for <strong>${electionTitle}</strong>. Your vote is confidential, cryptographically anonymous, and essential.
          </p>

          ${
            customMessage
              ? `<div class="custom-msg">"${customMessage}"</div>`
              : ''
          }

          <div class="timeline">
            <div class="timeline-row">
              <span>Polls Open:</span>
              <span class="timeline-value">${startDate || 'Open Now'}</span>
            </div>
            <div class="timeline-row">
              <span>Polls Close:</span>
              <span class="timeline-value">${endDate || 'Upon conclusion'}</span>
            </div>
          </div>

          <div class="btn-container">
            <a href="${voteUrl}" class="btn">Cast Your Ballot Now 🗳️</a>
          </div>

          <div class="privacy-notice">
            🔒 100% Cryptographically Anonymous — Your vote cannot be linked to your identity
          </div>

          <div class="footer">
            You received this reminder because you are an eligible elector for ${orgName} who has not yet cast a ballot.<br>
            Powered by <strong>VoteSphere</strong> — Verifiable & Anonymous Online Voting Architecture.
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML email template for certified results publication notices
 */
export function generateResultsAnnouncementHtml({
  electionTitle,
  orgName,
  resultsUrl,
  certifiedAt,
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 32px 16px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; }
          .badge { display: inline-block; padding: 4px 12px; background-color: #064e3b; color: #6ee7b7; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
          .title { font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #ffffff; letter-spacing: -0.025em; line-height: 1.25; }
          .org { font-size: 14px; color: #9ca3af; margin-bottom: 24px; }
          .msg { font-size: 14px; color: #d1d5db; line-height: 1.6; margin-bottom: 28px; }
          .btn-container { margin: 28px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.4); }
          .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #1f2937; font-size: 11px; color: #6b7280; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">Official Results Certified 🏆</span>
          <h1 class="title">${electionTitle}</h1>
          <div class="org">Organized by <strong>${orgName}</strong></div>

          <p class="msg">
            Voting has concluded and the official election results and winner determinations have been cryptographically sealed and published.
          </p>

          <div class="btn-container">
            <a href="${resultsUrl}" class="btn">View Official Results & Turnout</a>
          </div>

          <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
            Certified on: ${certifiedAt || new Date().toLocaleDateString()}
          </div>

          <div class="footer">
            Powered by <strong>VoteSphere</strong> — Verifiable & Anonymous Online Voting Architecture.
          </div>
        </div>
      </body>
    </html>
  `;
}

import { sendEmail } from './client.js';

/**
 * Dispatch an election voter ballot invitation email
 */
export async function sendElectionVoterInvitationEmail({
  email,
  electionTitle,
  orgName,
  voteUrl,
  startDate,
  endDate,
  customMessage,
}) {
  const subject = `Official Ballot: Vote in ${electionTitle} (${orgName})`;
  const html = generateVoterInvitationHtml({
    electionTitle,
    orgName,
    voteUrl,
    startDate,
    endDate,
    customMessage,
  });

  return sendEmail({
    to: email,
    subject,
    html,
    eventType: 'election_ballot_invitation',
  });
}

/**
 * Dispatch an election voting reminder email
 */
export async function sendElectionReminderEmail({
  email,
  electionTitle,
  orgName,
  voteUrl,
  startDate,
  endDate,
  customMessage,
}) {
  const subject = `Reminder: Don't forget to cast your ballot for ${electionTitle} (${orgName})`;
  const html = generateElectionReminderHtml({
    electionTitle,
    orgName,
    voteUrl,
    startDate,
    endDate,
    customMessage,
  });

  return sendEmail({
    to: email,
    subject,
    html,
    eventType: 'election_reminder',
  });
}

/**
 * Dispatch batch voter invitations
 */
export async function sendBatchElectionInvitations(recipients = [], electionData = {}) {
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const recipient of recipients) {
    const email = typeof recipient === 'string' ? recipient.trim() : recipient.email?.trim();
    if (!email || !email.includes('@')) {
      results.failed += 1;
      continue;
    }

    try {
      const res = await sendElectionVoterInvitationEmail({
        email,
        electionTitle: electionData.title,
        orgName: electionData.orgName || electionData.organization?.name || 'Organization',
        voteUrl: electionData.voteUrl,
        startDate: electionData.startDate,
        endDate: electionData.endDate,
        customMessage: electionData.customMessage,
      });

      if (res.success) {
        results.sent += 1;
      } else {
        results.failed += 1;
        if (res.error) results.errors.push({ email, error: res.error });
      }
    } catch (err) {
      results.failed += 1;
      results.errors.push({ email, error: err.message });
    }
  }

  return results;
}

/**
 * Dispatch batch election reminders to eligible voters
 */
export async function sendBatchElectionReminders(recipients = [], electionData = {}) {
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const recipient of recipients) {
    const email = typeof recipient === 'string' ? recipient.trim() : recipient.email?.trim();
    if (!email || !email.includes('@')) {
      results.failed += 1;
      continue;
    }

    try {
      const res = await sendElectionReminderEmail({
        email,
        electionTitle: electionData.title,
        orgName: electionData.orgName || electionData.organization?.name || 'Organization',
        voteUrl: electionData.voteUrl,
        startDate: electionData.startDate,
        endDate: electionData.endDate,
        customMessage: electionData.customMessage,
      });

      if (res.success) {
        results.sent += 1;
      } else {
        results.failed += 1;
        if (res.error) results.errors.push({ email, error: res.error });
      }
    } catch (err) {
      results.failed += 1;
      results.errors.push({ email, error: err.message });
    }
  }

  return results;
}

/**
 * Dispatch an election certified results publication announcement email
 */
export async function sendElectionResultsAnnouncementEmail({
  email,
  electionTitle,
  orgName,
  resultsUrl,
  certifiedAt,
}) {
  const subject = `Official Certified Results: ${electionTitle} (${orgName})`;
  const html = generateResultsAnnouncementHtml({
    electionTitle,
    orgName,
    resultsUrl,
    certifiedAt,
  });

  return sendEmail({
    to: email,
    subject,
    html,
    eventType: 'election_results_announcement',
  });
}

/**
 * Dispatch batch certified election results announcements
 */
export async function sendBatchElectionResults(recipients = [], electionData = {}) {
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const recipient of recipients) {
    const email = typeof recipient === 'string' ? recipient.trim() : recipient.email?.trim();
    if (!email || !email.includes('@')) {
      results.failed += 1;
      continue;
    }

    try {
      const res = await sendElectionResultsAnnouncementEmail({
        email,
        electionTitle: electionData.title,
        orgName: electionData.orgName || electionData.organization?.name || 'Organization',
        resultsUrl: electionData.resultsUrl,
        certifiedAt: electionData.certifiedAt,
      });

      if (res.success) {
        results.sent += 1;
      } else {
        results.failed += 1;
        if (res.error) results.errors.push({ email, error: res.error });
      }
    } catch (err) {
      results.failed += 1;
      results.errors.push({ email, error: err.message });
    }
  }

  return results;
}
