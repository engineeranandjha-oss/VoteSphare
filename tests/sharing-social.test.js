import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getWhatsAppShareUrl,
  getTwitterShareUrl,
  getLinkedInShareUrl,
  getTelegramShareUrl,
  getEmailShareUrl,
  generateSocialShareLinks,
} from '../lib/sharing/social.js';

describe('Social Share Intent Test Suite', () => {
  const targetUrl = 'https://votesphere.io/e/elec-456-voting';
  const sampleText = 'Cast your vote in the Student Council Election 2026!';

  describe('1. Individual Platform Intent URLs', () => {
    it('generates valid WhatsApp intent URL with URL-encoded parameters', () => {
      const url = getWhatsAppShareUrl(sampleText, targetUrl);
      assert.ok(url.startsWith('https://api.whatsapp.com/send?text='));
      assert.ok(url.includes(encodeURIComponent(sampleText)));
      assert.ok(url.includes(encodeURIComponent(targetUrl)));
    });

    it('generates valid X / Twitter intent URL with hashtags', () => {
      const url = getTwitterShareUrl(sampleText, targetUrl, ['VoteSphere', 'CampusElection']);
      assert.ok(url.startsWith('https://twitter.com/intent/tweet?'));
      assert.ok(url.includes('hashtags=VoteSphere%2CCampusElection'));
      assert.ok(url.includes(encodeURIComponent(targetUrl)));
    });

    it('generates valid LinkedIn share offsite URL', () => {
      const url = getLinkedInShareUrl(targetUrl);
      assert.strictEqual(
        url,
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`
      );
    });

    it('generates valid Telegram share URL', () => {
      const url = getTelegramShareUrl(sampleText, targetUrl);
      assert.ok(url.startsWith('https://t.me/share/url?'));
      assert.ok(url.includes(encodeURIComponent(targetUrl)));
    });

    it('generates valid mailto URL with subject and body', () => {
      const subject = 'Your Voting Ballot';
      const body = `Please click here to vote: ${targetUrl}`;
      const url = getEmailShareUrl(subject, body);
      assert.ok(url.startsWith('mailto:?'));
      assert.ok(url.includes(`subject=${encodeURIComponent(subject)}`));
      assert.ok(url.includes(`body=${encodeURIComponent(body)}`));
    });
  });

  describe('2. Comprehensive Social Share Links Bundle', () => {
    it('generates complete social invitation bundle for an active ballot', () => {
      const election = {
        id: 'elec-456-voting',
        title: 'Student Senate 2026',
        organization: { name: 'UC Berkeley' },
      };

      const result = generateSocialShareLinks(election, targetUrl);

      assert.strictEqual(result.targetUrl, targetUrl);
      assert.ok(result.shareText.includes('Student Senate 2026'));
      assert.ok(result.shareText.includes('UC Berkeley'));
      assert.ok(result.whatsapp.includes('whatsapp.com'));
      assert.ok(result.twitter.includes('twitter.com'));
      assert.ok(result.linkedin.includes('linkedin.com'));
      assert.ok(result.telegram.includes('t.me'));
      assert.ok(result.email.startsWith('mailto:?'));
    });

    it('generates tailored results announcement when target URL is a results link', () => {
      const election = {
        id: 'elec-456-voting',
        title: 'Student Senate 2026',
        organization: { name: 'UC Berkeley' },
      };
      const resultsUrl = 'https://votesphere.io/e/elec-456-voting/results';

      const result = generateSocialShareLinks(election, resultsUrl);

      assert.ok(result.shareText.includes('Official certified results'));
      assert.ok(result.email.includes(encodeURIComponent('Official Election Results')));
    });
  });
});
