import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateVoterInvitationHtml,
  generateElectionReminderHtml,
  generateResultsAnnouncementHtml,
  sendElectionVoterInvitationEmail,
  sendBatchElectionInvitations,
  sendElectionReminderEmail,
  sendBatchElectionReminders,
  sendElectionResultsAnnouncementEmail,
  sendBatchElectionResults,
} from '../lib/email/election-notifications.js';

describe('Election Email Notifications & Sharing Test Suite', () => {
  const mockParams = {
    electionTitle: 'Annual Board of Directors Election 2026',
    orgName: 'Acme Cooperative',
    voteUrl: 'https://votesphere.io/e/elec-xyz/vote',
    resultsUrl: 'https://votesphere.io/e/elec-xyz/results',
    startDate: 'Oct 1, 2026',
    endDate: 'Oct 7, 2026',
    customMessage: 'Please submit your vote before the Friday deadline.',
  };

  describe('1. HTML Email Template Generators', () => {
    it('generates valid voter invitation HTML containing key election details', () => {
      const html = generateVoterInvitationHtml(mockParams);
      assert.ok(typeof html === 'string');
      assert.ok(html.includes('Annual Board of Directors Election 2026'));
      assert.ok(html.includes('Acme Cooperative'));
      assert.ok(html.includes('https://votesphere.io/e/elec-xyz/vote'));
      assert.ok(html.includes('Please submit your vote before the Friday deadline.'));
      assert.ok(html.includes('100% Cryptographically Anonymous'));
    });

    it('generates valid election reminder HTML containing urgent call-to-action and details', () => {
      const html = generateElectionReminderHtml(mockParams);
      assert.ok(typeof html === 'string');
      assert.ok(html.includes('Voting Reminder'));
      assert.ok(html.includes('Annual Board of Directors Election 2026'));
      assert.ok(html.includes('Acme Cooperative'));
      assert.ok(html.includes('Cast Your Ballot Now'));
      assert.ok(html.includes('https://votesphere.io/e/elec-xyz/vote'));
    });

    it('generates valid results announcement HTML', () => {
      const html = generateResultsAnnouncementHtml({
        electionTitle: mockParams.electionTitle,
        orgName: mockParams.orgName,
        resultsUrl: mockParams.resultsUrl,
        certifiedAt: 'Oct 8, 2026',
      });
      assert.ok(typeof html === 'string');
      assert.ok(html.includes('Official Results Certified'));
      assert.ok(html.includes(mockParams.electionTitle));
      assert.ok(html.includes(mockParams.resultsUrl));
      assert.ok(html.includes('Oct 8, 2026'));
    });
  });

  describe('2. Dispatcher & Batch Processing', () => {
    it('refuses to dispatch single voter invitation when EMAIL_DELIVERY_ENABLED is false', async () => {
      const originalEnv = process.env.EMAIL_DELIVERY_ENABLED;
      process.env.EMAIL_DELIVERY_ENABLED = 'false';

      const res = await sendElectionVoterInvitationEmail({
        email: 'voter@example.com',
        ...mockParams,
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.deliveryDisabled, true);

      process.env.EMAIL_DELIVERY_ENABLED = originalEnv;
    });

    it('refuses to dispatch single election reminder when EMAIL_DELIVERY_ENABLED is false', async () => {
      const originalEnv = process.env.EMAIL_DELIVERY_ENABLED;
      process.env.EMAIL_DELIVERY_ENABLED = 'false';

      const res = await sendElectionReminderEmail({
        email: 'unvoted@example.com',
        ...mockParams,
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.deliveryDisabled, true);

      process.env.EMAIL_DELIVERY_ENABLED = originalEnv;
    });

    it('refuses to dispatch single results announcement when EMAIL_DELIVERY_ENABLED is false', async () => {
      const originalEnv = process.env.EMAIL_DELIVERY_ENABLED;
      process.env.EMAIL_DELIVERY_ENABLED = 'false';

      const res = await sendElectionResultsAnnouncementEmail({
        email: 'member@example.com',
        electionTitle: mockParams.electionTitle,
        orgName: mockParams.orgName,
        resultsUrl: mockParams.resultsUrl,
        certifiedAt: '2026-10-08',
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.deliveryDisabled, true);

      process.env.EMAIL_DELIVERY_ENABLED = originalEnv;
    });

    it('processes batch invitations and accurately filters invalid recipient emails', async () => {
      const recipients = [
        'alice@example.com',
        'bob@example.com',
        'invalid-email-format',
        '',
      ];

      const electionData = {
        title: mockParams.electionTitle,
        orgName: mockParams.orgName,
        voteUrl: mockParams.voteUrl,
      };

      const results = await sendBatchElectionInvitations(recipients, electionData);

      assert.strictEqual(results.total, 4);
      assert.strictEqual(results.failed >= 2, true);
    });

    it('processes batch reminders and tracks delivery status counts', async () => {
      const recipients = ['voter1@example.com', 'invalid-email'];
      const electionData = {
        title: mockParams.electionTitle,
        orgName: mockParams.orgName,
        voteUrl: mockParams.voteUrl,
      };

      const results = await sendBatchElectionReminders(recipients, electionData);
      assert.strictEqual(results.total, 2);
      assert.strictEqual(results.failed >= 1, true);
    });

    it('processes batch results announcements and tracks delivery status counts', async () => {
      const recipients = ['member1@example.com', 'invalid-email'];
      const electionData = {
        title: mockParams.electionTitle,
        orgName: mockParams.orgName,
        resultsUrl: mockParams.resultsUrl,
        certifiedAt: '2026-10-08',
      };

      const results = await sendBatchElectionResults(recipients, electionData);
      assert.strictEqual(results.total, 2);
      assert.strictEqual(results.failed >= 1, true);
    });
  });
});


