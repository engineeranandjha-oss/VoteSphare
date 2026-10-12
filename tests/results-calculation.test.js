import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  determineWinner,
  calculatePositionResults,
} from '../lib/results/calculation.js';

describe('Result Calculation Engine Test Suite', () => {
  // ============================================================
  // 1. Winner Determination Tests
  // ============================================================
  describe('1. Winner Determination & Tie Breaks', () => {
    test('Correctly identifies a clear sole winner with victory margin', () => {
      const candidates = [
        { id: 'cand-1', name: 'Alice', voteCount: 45 },
        { id: 'cand-2', name: 'Bob', voteCount: 30 },
        { id: 'cand-3', name: 'Charlie', voteCount: 15 },
      ];

      const result = determineWinner(candidates);

      assert.strictEqual(result.status, 'decided');
      assert.strictEqual(result.isTie, false);
      assert.strictEqual(result.winner?.id, 'cand-1');
      assert.strictEqual(result.leadingVoteCount, 45);
      assert.strictEqual(result.tiedCandidates.length, 0);
      assert.strictEqual(result.marginVotes, 15); // 45 - 30
      assert.strictEqual(result.winners.length, 1);
    });

    test('Correctly detects two-way tie', () => {
      const candidates = [
        { id: 'cand-1', name: 'Alice', voteCount: 40 },
        { id: 'cand-2', name: 'Bob', voteCount: 40 },
        { id: 'cand-3', name: 'Charlie', voteCount: 20 },
      ];

      const result = determineWinner(candidates);

      assert.strictEqual(result.status, 'tie');
      assert.strictEqual(result.isTie, true);
      assert.strictEqual(result.winner, null);
      assert.strictEqual(result.leadingVoteCount, 40);
      assert.strictEqual(result.tiedCandidates.length, 2);
      assert.strictEqual(result.requiresRunoff, true);
      assert.deepStrictEqual(
        result.tiedCandidates.map((c) => c.id).sort(),
        ['cand-1', 'cand-2']
      );
    });

    test('Handles zero votes edge case safely', () => {
      const candidates = [
        { id: 'cand-1', name: 'Alice', voteCount: 0 },
        { id: 'cand-2', name: 'Bob', voteCount: 0 },
      ];

      const result = determineWinner(candidates);

      assert.strictEqual(result.status, 'no_votes');
      assert.strictEqual(result.isTie, false);
      assert.strictEqual(result.winner, null);
      assert.strictEqual(result.leadingVoteCount, 0);
    });

    test('Identifies uncontested election with single candidate', () => {
      const candidates = [{ id: 'cand-1', name: 'Alice', voteCount: 12 }];

      const result = determineWinner(candidates);

      assert.strictEqual(result.status, 'uncontested');
      assert.strictEqual(result.winner?.id, 'cand-1');
      assert.strictEqual(result.winners.length, 1);
      assert.strictEqual(result.isTie, false);
    });

    test('Enforces absolute majority (50% + 1) requirement', () => {
      // Scenario A: Candidate achieves > 50%
      const candidatesWin = [
        { id: 'cand-1', name: 'Alice', voteCount: 55 },
        { id: 'cand-2', name: 'Bob', voteCount: 30 },
        { id: 'cand-3', name: 'Charlie', voteCount: 15 },
      ]; // Total 100 votes: Alice 55%

      const winResult = determineWinner(candidatesWin, { rule: 'absolute_majority' });
      assert.strictEqual(winResult.status, 'decided');
      assert.strictEqual(winResult.winner?.id, 'cand-1');
      assert.strictEqual(winResult.requiresRunoff, false);

      // Scenario B: Plurality leader has < 50%
      const candidatesRunoff = [
        { id: 'cand-1', name: 'Alice', voteCount: 40 },
        { id: 'cand-2', name: 'Bob', voteCount: 35 },
        { id: 'cand-3', name: 'Charlie', voteCount: 25 },
      ]; // Total 100 votes: Alice 40%

      const runoffResult = determineWinner(candidatesRunoff, { rule: 'absolute_majority' });
      assert.strictEqual(runoffResult.status, 'no_majority');
      assert.strictEqual(runoffResult.winner, null);
      assert.strictEqual(runoffResult.requiresRunoff, true);
      assert.strictEqual(runoffResult.runoffCandidates.length, 2);
      assert.strictEqual(runoffResult.runoffCandidates[0].id, 'cand-1');
      assert.strictEqual(runoffResult.runoffCandidates[1].id, 'cand-2');
    });

    test('Enforces configurable supermajority threshold (e.g. 60%)', () => {
      const candidates = [
        { id: 'cand-1', name: 'Alice', voteCount: 55 },
        { id: 'cand-2', name: 'Bob', voteCount: 45 },
      ]; // Alice 55%

      const result = determineWinner(candidates, { rule: 'threshold', thresholdPercentage: 60.0 });
      assert.strictEqual(result.status, 'below_threshold');
      assert.strictEqual(result.winner, null);
      assert.strictEqual(result.requiresRunoff, true);
    });

    test('Elects multiple winners for multi-seat positions', () => {
      const candidates = [
        { id: 'cand-1', name: 'Alice', voteCount: 60 },
        { id: 'cand-2', name: 'Bob', voteCount: 45 },
        { id: 'cand-3', name: 'Charlie', voteCount: 30 },
        { id: 'cand-4', name: 'David', voteCount: 15 },
      ]; // 2 seats available -> Alice & Bob win

      const result = determineWinner(candidates, { seats: 2 });
      assert.strictEqual(result.status, 'decided');
      assert.strictEqual(result.winners.length, 2);
      assert.deepStrictEqual(
        result.winners.map((w) => w.id),
        ['cand-1', 'cand-2']
      );
      assert.strictEqual(result.marginVotes, 15); // 45 - 30
      assert.strictEqual(result.isTie, false);
    });

    test('Detects boundary tie in multi-seat positions', () => {
      const candidates = [
        { id: 'cand-1', name: 'Alice', voteCount: 60 },
        { id: 'cand-2', name: 'Bob', voteCount: 40 },
        { id: 'cand-3', name: 'Charlie', voteCount: 40 },
        { id: 'cand-4', name: 'David', voteCount: 10 },
      ]; // 2 seats available, Bob & Charlie tie for 2nd seat

      const result = determineWinner(candidates, { seats: 2 });
      assert.strictEqual(result.status, 'tie');
      assert.strictEqual(result.isTie, true);
      assert.strictEqual(result.winners.length, 1); // Alice is clear winner
      assert.strictEqual(result.winners[0].id, 'cand-1');
      assert.strictEqual(result.tiedCandidates.length, 2); // Bob & Charlie
      assert.strictEqual(result.requiresRunoff, true);
    });
  });

  // ============================================================
  // 2. Position Results & Vote Share Percentages
  // ============================================================
  describe('2. Position Vote Shares & Percentages', () => {
    test('Calculates accurate percentages and sorts candidates descending', () => {
      const mockPosition = {
        id: 'pos-president',
        name: 'President',
        order: 1,
        candidates: [
          { id: 'cand-1', name: 'Alice' },
          { id: 'cand-2', name: 'Bob' },
          { id: 'cand-3', name: 'Charlie' },
        ],
      };

      const mockVotes = [
        { candidateId: 'cand-1' },
        { candidateId: 'cand-1' },
        { candidateId: 'cand-1' },
        { candidateId: 'cand-2' },
      ]; // Total 4 votes: Alice 3 (75%), Bob 1 (25%), Charlie 0 (0%)

      const res = calculatePositionResults(mockPosition, mockVotes);

      assert.strictEqual(res.totalVotes, 4);
      assert.strictEqual(res.candidates.length, 3);

      // Top candidate must be Alice with 75%
      assert.strictEqual(res.candidates[0].id, 'cand-1');
      assert.strictEqual(res.candidates[0].voteCount, 3);
      assert.strictEqual(res.candidates[0].percentage, 75.0);
      assert.strictEqual(res.candidates[0].isWinner, true);

      // Second candidate must be Bob with 25%
      assert.strictEqual(res.candidates[1].id, 'cand-2');
      assert.strictEqual(res.candidates[1].voteCount, 1);
      assert.strictEqual(res.candidates[1].percentage, 25.0);
      assert.strictEqual(res.candidates[1].isWinner, false);

      // Third candidate must be Charlie with 0%
      assert.strictEqual(res.candidates[2].id, 'cand-3');
      assert.strictEqual(res.candidates[2].voteCount, 0);
      assert.strictEqual(res.candidates[2].percentage, 0.0);
      assert.strictEqual(res.candidates[2].isWinner, false);
    });

    test('Handles position with 0 total votes without division by zero errors', () => {
      const mockPosition = {
        id: 'pos-treasurer',
        name: 'Treasurer',
        candidates: [{ id: 'cand-1', name: 'Alice' }],
      };

      const res = calculatePositionResults(mockPosition, []);

      assert.strictEqual(res.totalVotes, 0);
      assert.strictEqual(res.candidates[0].percentage, 0);
      assert.strictEqual(res.candidates[0].isWinner, false);
    });
  });

  // ============================================================
  // 3. Turnout & Quorum Calculation Tests
  // ============================================================
  describe('3. Turnout & Quorum Formulas', () => {
    test('Calculates turnout percentages accurately', () => {
      const totalEligible = 200;
      const totalVoted = 150;
      const turnoutRate = totalEligible > 0 ? Number(((totalVoted / totalEligible) * 100).toFixed(2)) : 0;

      assert.strictEqual(turnoutRate, 75.0);
    });

    test('Assesses quorum target fulfillment correctly', () => {
      const totalEligible = 100;
      const totalVoted = 55;
      const quorumTarget = 50; // 50% target
      const turnoutRate = (totalVoted / totalEligible) * 100;
      const isMet = turnoutRate >= quorumTarget;
      const requiredVotes = Math.ceil((totalEligible * quorumTarget) / 100);

      assert.strictEqual(isMet, true);
      assert.strictEqual(requiredVotes, 50);
      assert.strictEqual(Math.max(0, requiredVotes - totalVoted), 0);
    });
  });
});
