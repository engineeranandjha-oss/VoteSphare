import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getResultsUrl,
  getOrgScopedResultsUrl,
  getTurnoutMonitoringUrl,
  getResultsVerificationUrl,
  generateResultsShareLinks,
} from '../lib/sharing/links.js';

describe('Results Link Generation Test Suite', () => {
  const mockBaseUrl = 'https://votesphere.io';
  const electionId = 'elec-777-uuid';
  const orgSlug = 'mit-association';
  const snapshotHash = 'a1b2c3d4e5f67890abcdef1234567890';

  describe('1. Results URL Generators', () => {
    it('generates canonical results URL', () => {
      const url = getResultsUrl(electionId, mockBaseUrl);
      assert.strictEqual(url, 'https://votesphere.io/e/elec-777-uuid/results');
    });

    it('generates organization-scoped results vanity URL', () => {
      const url = getOrgScopedResultsUrl(orgSlug, electionId, mockBaseUrl);
      assert.strictEqual(url, 'https://votesphere.io/org/mit-association/e/elec-777-uuid/results');
    });

    it('falls back to public results URL when orgSlug is omitted', () => {
      const url = getOrgScopedResultsUrl(null, electionId, mockBaseUrl);
      assert.strictEqual(url, 'https://votesphere.io/e/elec-777-uuid/results');
    });

    it('generates direct live turnout monitoring URL with view=turnout query param', () => {
      const url = getTurnoutMonitoringUrl(electionId, mockBaseUrl);
      assert.strictEqual(url, 'https://votesphere.io/e/elec-777-uuid/results?view=turnout');
    });

    it('generates cryptographic ledger verification URL with hash parameter', () => {
      const url = getResultsVerificationUrl(electionId, snapshotHash, mockBaseUrl);
      assert.strictEqual(
        url,
        `https://votesphere.io/e/elec-777-uuid/results?verify=snapshot&hash=${snapshotHash}`
      );
    });
  });

  describe('2. Comprehensive Results Share Bundle', () => {
    it('generates live status bundle with live turnout announcement text', () => {
      const election = {
        id: electionId,
        title: 'Spring 2026 Student Senate',
        status: 'live',
        organization: { slug: orgSlug },
      };

      const result = generateResultsShareLinks(election, mockBaseUrl);

      assert.strictEqual(result.electionId, electionId);
      assert.strictEqual(result.isCertified, false);
      assert.strictEqual(result.resultsUrl, 'https://votesphere.io/e/elec-777-uuid/results');
      assert.strictEqual(
        result.vanityResultsUrl,
        'https://votesphere.io/org/mit-association/e/elec-777-uuid/results'
      );
      assert.strictEqual(
        result.turnoutUrl,
        'https://votesphere.io/e/elec-777-uuid/results?view=turnout'
      );
      assert.ok(result.shareText.includes('Live voter turnout'));
    });

    it('generates certified published status bundle with certified snapshot hash', () => {
      const election = {
        id: electionId,
        title: 'Spring 2026 Student Senate',
        status: 'published',
        isCertified: true,
        certifiedSnapshot: { snapshotHash },
        organization: { slug: orgSlug },
      };

      const result = generateResultsShareLinks(election, mockBaseUrl);

      assert.strictEqual(result.isCertified, true);
      assert.strictEqual(result.snapshotHash, snapshotHash);
      assert.ok(result.verificationUrl.includes(`hash=${snapshotHash}`));
      assert.ok(result.shareText.includes('Official results for "Spring 2026 Student Senate" are now certified'));
    });
  });
});
