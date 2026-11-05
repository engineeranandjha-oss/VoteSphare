/**
 * VoteSphere Social Share Intent Engine
 * Formats platform-specific sharing URLs with URI encoding.
 */

/**
 * Generate WhatsApp share intent URL
 * @param {string} text
 * @param {string} [url]
 * @returns {string}
 */
export function getWhatsAppShareUrl(text, url = '') {
  const fullText = url ? `${text}\n${url}` : text;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
}

/**
 * Generate X / Twitter intent URL
 * @param {string} text
 * @param {string} url
 * @param {string[]} [hashtags]
 * @returns {string}
 */
export function getTwitterShareUrl(text, url, hashtags = ['VoteSphere', 'Voting']) {
  const params = new URLSearchParams();
  if (text) params.append('text', text);
  if (url) params.append('url', url);
  if (hashtags && hashtags.length > 0) {
    params.append('hashtags', hashtags.join(','));
  }
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate LinkedIn share URL
 * @param {string} url
 * @returns {string}
 */
export function getLinkedInShareUrl(url) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

/**
 * Generate Telegram share intent URL
 * @param {string} text
 * @param {string} url
 * @returns {string}
 */
export function getTelegramShareUrl(text, url) {
  const params = new URLSearchParams();
  if (url) params.append('url', url);
  if (text) params.append('text', text);
  return `https://t.me/share/url?${params.toString()}`;
}

/**
 * Generate mailto share link
 * @param {string} subject
 * @param {string} body
 * @returns {string}
 */
export function getEmailShareUrl(subject, body) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Generate complete social share URLs bundle for an election
 * @param {object} election
 * @param {string} targetUrl
 * @returns {object}
 */
export function generateSocialShareLinks(election, targetUrl) {
  const title = election?.title || 'VoteSphere Election';
  const orgName = election?.organization?.name || 'our organization';
  const isResults = targetUrl?.includes('/results');

  const shareText = isResults
    ? `Official certified results for "${title}" organized by ${orgName} are now available on VoteSphere!`
    : `You are invited to vote in "${title}" organized by ${orgName} on VoteSphere! Cast your secure, anonymous ballot here:`;

  const emailSubject = isResults
    ? `Official Election Results: ${title}`
    : `Invitation to Vote: ${title}`;

  const emailBody = `${shareText}\n\nAccess Link: ${targetUrl}\n\nPowered by VoteSphere — Secure, Verifiable & Anonymous Online Voting.`;

  return {
    whatsapp: getWhatsAppShareUrl(shareText, targetUrl),
    twitter: getTwitterShareUrl(shareText, targetUrl),
    linkedin: getLinkedInShareUrl(targetUrl),
    telegram: getTelegramShareUrl(shareText, targetUrl),
    email: getEmailShareUrl(emailSubject, emailBody),
    shareText,
    targetUrl,
  };
}
