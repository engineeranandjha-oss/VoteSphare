/**
 * VoteSphere Voting & Results Link Generation Engine
 * Generates canonical, vanity, and direct voting/results URLs with UTM / referral metadata.
 */

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://votesphere.app';

/**
 * Clean and format base URL string
 */
export function normalizeBaseUrl(baseUrl) {
  const url = baseUrl || DEFAULT_BASE_URL;
  return url.replace(/\/+$/, '');
}

/**
 * Get the current base URL
 * @param {string} [baseUrl]
 * @returns {string}
 */
export function getBaseUrl(baseUrl) {
  return normalizeBaseUrl(baseUrl);
}

/**
 * Append optional query parameters to a URL
 */
function appendQueryParams(url, params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  if (!queryString) return url;
  return url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
}

/**
 * Generate canonical public election overview link
 * @param {string} electionId
 * @param {string} [baseUrl]
 * @param {object} [queryParams]
 * @returns {string}
 */
export function getPublicElectionUrl(electionId, baseUrl, queryParams = {}) {
  if (!electionId) throw new Error('electionId is required');
  const base = normalizeBaseUrl(baseUrl);
  const url = `${base}/e/${electionId}`;
  return appendQueryParams(url, queryParams);
}

/**
 * Generate direct ballot voting booth link
 * @param {string} electionId
 * @param {string} [baseUrl]
 * @param {object} [queryParams]
 * @returns {string}
 */
export function getDirectVotingBoothUrl(electionId, baseUrl, queryParams = {}) {
  if (!electionId) throw new Error('electionId is required');
  const base = normalizeBaseUrl(baseUrl);
  const url = `${base}/e/${electionId}/vote`;
  return appendQueryParams(url, queryParams);
}

/**
 * Generate organization-scoped vanity election link
 * @param {string} orgSlug
 * @param {string} electionId
 * @param {string} [baseUrl]
 * @param {object} [queryParams]
 * @returns {string}
 */
export function getOrgScopedElectionUrl(orgSlug, electionId, baseUrl, queryParams = {}) {
  if (!orgSlug) return getPublicElectionUrl(electionId, baseUrl, queryParams);
  const base = normalizeBaseUrl(baseUrl);
  const url = `${base}/org/${orgSlug}/e/${electionId}`;
  return appendQueryParams(url, queryParams);
}

/**
 * Generate public results link
 * @param {string} electionId
 * @param {string} [baseUrl]
 * @param {object} [queryParams]
 * @returns {string}
 */
export function getResultsUrl(electionId, baseUrl, queryParams = {}) {
  if (!electionId) throw new Error('electionId is required');
  const base = normalizeBaseUrl(baseUrl);
  const url = `${base}/e/${electionId}/results`;
  return appendQueryParams(url, queryParams);
}

/**
 * Generate organization-scoped vanity results link
 * @param {string} orgSlug
 * @param {string} electionId
 * @param {string} [baseUrl]
 * @param {object} [queryParams]
 * @returns {string}
 */
export function getOrgScopedResultsUrl(orgSlug, electionId, baseUrl, queryParams = {}) {
  if (!orgSlug) return getResultsUrl(electionId, baseUrl, queryParams);
  const base = normalizeBaseUrl(baseUrl);
  const url = `${base}/org/${orgSlug}/e/${electionId}/results`;
  return appendQueryParams(url, queryParams);
}

/**
 * Generate direct live turnout monitoring URL
 * @param {string} electionId
 * @param {string} [baseUrl]
 * @param {object} [queryParams]
 * @returns {string}
 */
export function getTurnoutMonitoringUrl(electionId, baseUrl, queryParams = {}) {
  return getResultsUrl(electionId, baseUrl, { ...queryParams, view: 'turnout' });
}

/**
 * Generate cryptographic snapshot verification deep-link
 * @param {string} electionId
 * @param {string} [snapshotHash]
 * @param {string} [baseUrl]
 * @returns {string}
 */
export function getResultsVerificationUrl(electionId, snapshotHash, baseUrl) {
  const params = { verify: 'snapshot' };
  if (snapshotHash) params.hash = snapshotHash;
  return getResultsUrl(electionId, baseUrl, params);
}

/**
 * Generate complete suite of shareable links and embed code for an election
 * @param {object} election - Election object with id, title, and optional organization
 * @param {string} [baseUrl]
 * @param {object} [options] - Options such as source, medium, campaign tags
 * @returns {object}
 */
export function generateShareableLinks(election, baseUrl, options = {}) {
  if (!election || !election.id) {
    throw new Error('Valid election object with id is required');
  }

  const base = normalizeBaseUrl(baseUrl);
  const orgSlug = election.organization?.slug || election.orgSlug;

  const publicUrl = getPublicElectionUrl(election.id, base, options.utm);
  const voteUrl = getDirectVotingBoothUrl(election.id, base, options.utm);
  const vanityUrl = orgSlug ? getOrgScopedElectionUrl(orgSlug, election.id, base, options.utm) : null;
  const resultsUrl = getResultsUrl(election.id, base, options.utm);

  const iframeEmbedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0" allowtransparency="true" title="${election.title || 'VoteSphere Election'}"></iframe>`;

  return {
    electionId: election.id,
    electionTitle: election.title,
    publicUrl,
    voteUrl,
    vanityUrl,
    resultsUrl,
    iframeEmbedCode,
    metadata: {
      generatedAt: new Date().toISOString(),
      baseUrl: base,
    },
  };
}

/**
 * Generate specialized results sharing links bundle
 * @param {object} election
 * @param {string} [baseUrl]
 * @param {object} [options]
 * @returns {object}
 */
export function generateResultsShareLinks(election, baseUrl, options = {}) {
  if (!election || !election.id) {
    throw new Error('Valid election object with id is required');
  }

  const base = normalizeBaseUrl(baseUrl);
  const orgSlug = election.organization?.slug || election.orgSlug;
  const snapshotHash = election.certifiedSnapshot?.snapshotHash || options.snapshotHash;

  const resultsUrl = getResultsUrl(election.id, base, options.utm);
  const vanityResultsUrl = orgSlug ? getOrgScopedResultsUrl(orgSlug, election.id, base, options.utm) : null;
  const turnoutUrl = getTurnoutMonitoringUrl(election.id, base, options.utm);
  const verificationUrl = getResultsVerificationUrl(election.id, snapshotHash, base);

  const isPublished = election.status === 'published' || election.isCertified;
  const shareText = isPublished
    ? `Official results for "${election.title || 'the election'}" are now certified on VoteSphere: ${resultsUrl}`
    : `Live voter turnout for "${election.title || 'the election'}" is being monitored on VoteSphere: ${turnoutUrl}`;

  return {
    electionId: election.id,
    electionTitle: election.title,
    status: election.status,
    isCertified: Boolean(isPublished),
    resultsUrl,
    vanityResultsUrl,
    turnoutUrl,
    verificationUrl,
    shareText,
    snapshotHash: snapshotHash || null,
    metadata: {
      generatedAt: new Date().toISOString(),
      baseUrl: base,
    },
  };
}
