import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBaseUrl,
  getBaseUrl,
  getPublicElectionUrl,
  getDirectVotingBoothUrl,
  getOrgScopedElectionUrl,
  getResultsUrl,
  generateShareableLinks,
} from '../lib/sharing/links.js';

describe('Voting Link Generation Test Suite', () => {
  const mockBaseUrl = 'https://votesphere.io';
  const electionId = 'elec-999-uuid';
  const orgSlug = 'stanford-cs';

  describe('1. Individual URL Builders', () => {
    it('normalizes base URLs with trailing slashes correctly', () => {
      assert.strictEqual(normalizeBaseUrl('https://app.votesphere.com/'), 'https://app.votesphere.com');
      assert.strictEqual(normalizeBaseUrl('https://app.votesphere.com///'), 'https://app.votesphere.com');
      assert.strictEqual(getBaseUrl('https://app.votesphere.com/'), 'https://app.votesphere.com');
      assert.ok(typeof getBaseUrl() === 'string');
    });

    it('generates canonical public election URL', () => {
      const url = getPublicElectionUrl(electionId, mockBaseUrl);
      assert.strictEqual(url, 'https://votesphere.io/e/elec-999-uuid');
    });

    it('generates direct voting booth URL', () => {
      const url = getDirectVotingBoothUrl(electionId, mockBaseUrl);
      assert.strictEqual(url, 'https://votesphere.io/e/elec-999-uuid/vote');
    });

    it('generates organization vanity URL when orgSlug is provided', () => {
      const url = getOrgScopedElectionUrl(orgSlug, electionId, mockBaseUrl);
      assert.strictEqual(url, 'https://votesphere.io/org/stanford-cs/e/elec-999-uuid');
    });

    it('falls back to public URL if orgSlug is null or missing', () => {
      const url = getOrgScopedElectionUrl(null, electionId, mockBaseUrl);
      assert.strictEqual(url, 'https://votesphere.io/e/elec-999-uuid');
    });

    it('generates public results URL', () => {
      const url = getResultsUrl(electionId, mockBaseUrl);
      assert.strictEqual(url, 'https://votesphere.io/e/elec-999-uuid/results');
    });
  });

  describe('2. UTM & Referral Parameters', () => {
    it('appends UTM parameters properly to URLs', () => {
      const url = getPublicElectionUrl(electionId, mockBaseUrl, {
        utm_source: 'newsletter',
        utm_medium: 'email',
        utm_campaign: 'fall2026',
      });
      assert.ok(url.includes('utm_source=newsletter'));
      assert.ok(url.includes('utm_medium=email'));
      assert.ok(url.includes('utm_campaign=fall2026'));
      assert.ok(url.startsWith('https://votesphere.io/e/elec-999-uuid?'));
    });

    it('ignores empty, null or undefined query parameters', () => {
      const url = getPublicElectionUrl(electionId, mockBaseUrl, {
        utm_source: 'twitter',
        emptyKey: '',
        nullKey: null,
        undefinedKey: undefined,
      });
      assert.strictEqual(url, 'https://votesphere.io/e/elec-999-uuid?utm_source=twitter');
    });
  });

  describe('3. Complete Shareable Links Generation', () => {
    it('generates comprehensive suite with vanity URL and iframe embed code', () => {
      const election = {
        id: electionId,
        title: 'Fall 2026 President Election',
        organization: { slug: orgSlug },
      };

      const result = generateShareableLinks(election, mockBaseUrl);

      assert.strictEqual(result.electionId, electionId);
      assert.strictEqual(result.electionTitle, 'Fall 2026 President Election');
      assert.strictEqual(result.publicUrl, 'https://votesphere.io/e/elec-999-uuid');
      assert.strictEqual(result.voteUrl, 'https://votesphere.io/e/elec-999-uuid/vote');
      assert.strictEqual(result.vanityUrl, 'https://votesphere.io/org/stanford-cs/e/elec-999-uuid');
      assert.strictEqual(result.resultsUrl, 'https://votesphere.io/e/elec-999-uuid/results');
      assert.ok(result.iframeEmbedCode.includes('<iframe src="https://votesphere.io/e/elec-999-uuid"'));
    });

    it('throws error if election or election.id is missing', () => {
      assert.throws(() => generateShareableLinks(null), /Valid election object/);
      assert.throws(() => generateShareableLinks({}), /Valid election object/);
    });
  });
});
