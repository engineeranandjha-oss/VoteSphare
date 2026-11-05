import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppShareUrl,
  generateWhatsAppBallotInvite,
  generateWhatsAppTurnoutUpdate,
  generateWhatsAppResultsAnnouncement,
} from '../lib/sharing/whatsapp.js';

describe('WhatsApp Broadcast & Sharing Test Suite', () => {
  const election = {
    id: 'elec-wa-123',
    title: 'Executive Council Elections 2026',
    organization: { name: 'Harvard Alumni Club' },
    startDate: '2026-10-01T00:00:00Z',
    endDate: '2026-10-07T23:59:59Z',
  };

  const voteUrl = 'https://votesphere.io/e/elec-wa-123/vote';
  const resultsUrl = 'https://votesphere.io/e/elec-wa-123/results';
  const turnoutUrl = 'https://votesphere.io/e/elec-wa-123/results?view=turnout';

  describe('1. Share URL Builder', () => {
    it('generates a valid WhatsApp API share URL with encoded message', () => {
      const msg = 'Vote for your representatives on VoteSphere!';
      const url = buildWhatsAppShareUrl(msg);
      assert.ok(url.startsWith('https://api.whatsapp.com/send?text='));
      assert.ok(url.includes(encodeURIComponent(msg)));
    });

    it('throws error when message is empty or null', () => {
      assert.throws(() => buildWhatsAppShareUrl(''), /Message text is required/);
      assert.throws(() => buildWhatsAppShareUrl(null), /Message text is required/);
    });
  });

  describe('2. Message Template Generators', () => {
    it('generates structured WhatsApp ballot invitation with markdown tags', () => {
      const text = generateWhatsAppBallotInvite(election, voteUrl, {
        customMessage: 'Be sure to submit your vote early!',
      });

      assert.ok(text.includes('*OFFICIAL VOTING BALLOT*'));
      assert.ok(text.includes('*Executive Council Elections 2026*'));
      assert.ok(text.includes('*Harvard Alumni Club*'));
      assert.ok(text.includes(voteUrl));
      assert.ok(text.includes('Be sure to submit your vote early!'));
      assert.ok(text.includes('_100% anonymous & cryptographically verifiable on VoteSphere._'));
    });

    it('generates live turnout broadcast update', () => {
      const turnoutStats = {
        turnoutPercentage: 68.4,
        totalVoted: 342,
        totalEligible: 500,
      };

      const text = generateWhatsAppTurnoutUpdate(election, turnoutUrl, turnoutStats);

      assert.ok(text.includes('*LIVE ELECTION TURNOUT UPDATE*'));
      assert.ok(text.includes('*68.4%*'));
      assert.ok(text.includes('342 of 500 ballots cast'));
      assert.ok(text.includes(turnoutUrl));
    });

    it('generates official results announcement with certified winner roster', () => {
      const winners = [
        { positionName: 'President', candidateName: 'Jane Doe' },
        { positionName: 'Treasurer', candidateName: 'John Smith' },
      ];

      const text = generateWhatsAppResultsAnnouncement(election, resultsUrl, winners);

      assert.ok(text.includes('*OFFICIAL ELECTION RESULTS CERTIFIED*'));
      assert.ok(text.includes('*President*: Jane Doe'));
      assert.ok(text.includes('*Treasurer*: John Smith'));
      assert.ok(text.includes(resultsUrl));
    });
  });
});
