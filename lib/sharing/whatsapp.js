/**
 * VoteSphere WhatsApp Community Broadcast Engine
 * Generates formatted, high-converting WhatsApp announcement templates with native deep-links.
 */

/**
 * Generate a WhatsApp API share URL for a given pre-formatted message
 * @param {string} message
 * @returns {string}
 */
export function buildWhatsAppShareUrl(message) {
  if (!message) throw new Error('Message text is required');
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Generate a formatted ballot invitation message for WhatsApp
 * @param {object} election
 * @param {string} voteUrl
 * @param {object} [options]
 * @returns {string}
 */
export function generateWhatsAppBallotInvite(election, voteUrl, options = {}) {
  const title = election?.title || 'Election';
  const orgName = election?.organization?.name || election?.orgName || 'Our Organization';
  const startDate = election?.startDate ? new Date(election.startDate).toLocaleDateString() : 'Open Now';
  const endDate = election?.endDate ? new Date(election.endDate).toLocaleDateString() : 'Closing Soon';
  const customNote = options.customMessage ? `\n\n📌 _"${options.customMessage}"_` : '';

  return (
    `🗳️ *OFFICIAL VOTING BALLOT*\n\n` +
    `*${title}*\n` +
    `🏛️ Organized by: *${orgName}*\n` +
    `📅 Voting Window: ${startDate} – ${endDate}${customNote}\n\n` +
    `👉 *Cast your ballot here:*\n` +
    `${voteUrl}\n\n` +
    `🔒 _100% anonymous & cryptographically verifiable on VoteSphere._`
  );
}

/**
 * Generate a formatted live turnout update message for WhatsApp
 * @param {object} election
 * @param {string} turnoutUrl
 * @param {object} [turnoutStats]
 * @returns {string}
 */
export function generateWhatsAppTurnoutUpdate(election, turnoutUrl, turnoutStats = {}) {
  const title = election?.title || 'Election';
  const percentage = turnoutStats.turnoutPercentage || 0;
  const votedCount = turnoutStats.totalVoted || 0;
  const eligibleCount = turnoutStats.totalEligible || 0;

  return (
    `📊 *LIVE ELECTION TURNOUT UPDATE*\n\n` +
    `*${title}*\n` +
    `📈 Participation: *${percentage}%* (${votedCount} of ${eligibleCount} ballots cast)\n\n` +
    `👉 *Track live voter turnout & quorum here:*\n` +
    `${turnoutUrl}\n\n` +
    `⏰ _If you haven't voted yet, polls remain open!_`
  );
}

/**
 * Generate a formatted certified results announcement for WhatsApp
 * @param {object} election
 * @param {string} resultsUrl
 * @param {Array} [winners]
 * @returns {string}
 */
export function generateWhatsAppResultsAnnouncement(election, resultsUrl, winners = []) {
  const title = election?.title || 'Election';
  const orgName = election?.organization?.name || election?.orgName || 'Our Organization';

  let winnersSnippet = '';
  if (winners && winners.length > 0) {
    winnersSnippet =
      `\n🏆 *Certified Winners:*\n` +
      winners
        .map((w) => `• *${w.positionName || 'Position'}*: ${w.candidateName || w.name}`)
        .join('\n') +
      `\n`;
  }

  return (
    `🏆 *OFFICIAL ELECTION RESULTS CERTIFIED*\n\n` +
    `*${title}*\n` +
    `🏛️ ${orgName}\n` +
    `${winnersSnippet}\n` +
    `👉 *View full vote tallies & certification proof:*\n` +
    `${resultsUrl}\n\n` +
    `✨ _Thank you to all electors for participating!_`
  );
}
