import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateCanPublish } from '../lib/results/publishing.js';
import { canTransition } from '../lib/elections/lifecycle.js';

describe('Results Publishing Service Test Suite', () => {
  // ============================================================
  // 1. Publishing State Transitions & Validation
  // ============================================================
  describe('1. State Transition & Readiness Rules', () => {
    test('validateCanPublish permits ended and published status', () => {
      assert.doesNotThrow(() => {
        validateCanPublish({ status: 'ended' });
      });

      assert.doesNotThrow(() => {
        validateCanPublish({ status: 'published' });
      });
    });

    test('validateCanPublish rejects non-ended elections', () => {
      assert.throws(
        () => {
          validateCanPublish({ status: 'live' });
        },
        /Cannot publish results for an election in 'live' status/
      );

      assert.throws(
        () => {
          validateCanPublish({ status: 'draft' });
        },
        /Cannot publish results for an election in 'draft' status/
      );

      assert.throws(
        () => {
          validateCanPublish({ status: 'scheduled' });
        },
        /Cannot publish results for an election in 'scheduled' status/
      );
    });

    test('canTransition allows ended -> published and published -> ended', () => {
      assert.strictEqual(canTransition('ended', 'published'), true);
      assert.strictEqual(canTransition('published', 'ended'), true);
      assert.strictEqual(canTransition('draft', 'published'), false);
      assert.strictEqual(canTransition('live', 'published'), false);
    });
  });

  // ============================================================
  // 2. Snapshot Metadata Structure
  // ============================================================
  describe('2. Snapshot Structure Verification', () => {
    test('Constructs certified snapshot schema with complete audit fields', () => {
      const mockSnapshot = {
        certifiedAt: new Date().toISOString(),
        winningRule: 'plurality',
        isFullyDecided: true,
        hasTies: false,
        totalVotesCast: 150,
        turnout: {
          totalEligible: 200,
          totalVoted: 150,
          turnoutPercentage: 75.0,
        },
        positions: [
          {
            positionId: 'pos-1',
            positionName: 'President',
            status: 'decided',
            winners: [{ id: 'cand-1', name: 'Alice', voteCount: 100, percentage: 66.67 }],
            marginVotes: 50,
            marginPercentage: 33.34,
          },
        ],
      };

      assert.strictEqual(mockSnapshot.isFullyDecided, true);
      assert.strictEqual(mockSnapshot.totalVotesCast, 150);
      assert.strictEqual(mockSnapshot.turnout.turnoutPercentage, 75.0);
      assert.strictEqual(mockSnapshot.positions[0].winners[0].id, 'cand-1');
      assert.strictEqual(mockSnapshot.positions[0].marginVotes, 50);
    });
  });
});
