import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  determineWinner,
  calculatePositionResults,
} from '../lib/results/calculation.js';

describe('VoteSphere Election Result Calculation & Tie-Condition Audit Test Suite', () => {
  // =========================================================================
  // Scenario 1: Exact UI Example — "Lok Shabha Election 2029" (Three-Way Tie)
  // 1 Position, 3 Candidates, 3 Electors, 100% Turnout, 1 vote each
  // =========================================================================
  describe('Scenario 1: Three-Way Tie (Lok Sabha Election 2029)', () => {
    const candidateA = { id: 'cand-001', name: 'Candidate A', voteCount: 1 };
    const candidateB = { id: 'cand-002', name: 'Candidate B', voteCount: 1 };
    const candidateC = { id: 'cand-003', name: 'Candidate C', voteCount: 1 };
    const candidates = [candidateA, candidateB, candidateC];

    test('detects a three-way tie without arbitrarily declaring a winner', () => {
      const result = determineWinner(candidates, { rule: 'plurality', seats: 1 });

      // 1. Status and Flags
      assert.equal(result.status, 'tie', 'Result status must be "tie"');
      assert.equal(result.isTie, true, 'isTie must be true');
      assert.equal(result.winner, null, 'Winner must be strictly null');
      assert.equal(result.winners.length, 0, 'Winners array must be empty');

      // 2. Tied Candidates
      assert.equal(result.tiedCandidates.length, 3, 'All 3 tied candidates must be returned');
      assert.equal(result.leadingVoteCount, 1, 'Leading vote count is 1');
      assert.equal(result.marginVotes, 0, 'Victory margin must be 0');
      assert.equal(result.marginPercentage, 0, 'Victory margin % must be 0');

      // 3. Runoff Determination
      assert.equal(result.requiresRunoff, true, 'Requires runoff must be true');
      assert.equal(result.runoffCandidates.length, 3, 'All 3 tied candidates must be designated for runoff');
    });

    test('calculatePositionResults flags all candidates as tied and none as winner', () => {
      const mockPosition = {
        id: 'pos-lok-sabha',
        name: 'Member of Parliament',
        candidates: [
          { id: 'cand-001', name: 'Candidate A' },
          { id: 'cand-002', name: 'Candidate B' },
          { id: 'cand-003', name: 'Candidate C' },
        ],
      };

      const mockVotes = [
        { candidateId: 'cand-001' },
        { candidateId: 'cand-002' },
        { candidateId: 'cand-003' },
      ];

      const posResult = calculatePositionResults(mockPosition, mockVotes, {
        rule: 'plurality',
        seats: 1,
      });

      assert.equal(posResult.status, 'tie');
      assert.equal(posResult.isTie, true);
      assert.equal(posResult.winner, null);
      assert.equal(posResult.winners.length, 0);
      assert.equal(posResult.totalVotes, 3);
      assert.equal(posResult.tiedCandidates.length, 3);

      // Verify individual candidate flags
      posResult.candidates.forEach((cand) => {
        assert.equal(cand.voteCount, 1);
        assert.equal(cand.isWinner, false, 'No candidate may be marked isWinner in a tie');
        assert.equal(cand.isTied, true, 'All tied candidates must have isTied = true');
      });
    });
  });

  // =========================================================================
  // Scenario 2: Two-Way Tie for 1st Place with Lower Runner-Up
  // =========================================================================
  describe('Scenario 2: Two-Way Tie for First Place', () => {
    const candidates = [
      { id: 'cand-alice', name: 'Alice Johnson', voteCount: 5 },
      { id: 'cand-bob', name: 'Bob Smith', voteCount: 5 },
      { id: 'cand-carol', name: 'Carol White', voteCount: 2 },
    ];

    test('returns 2 tied candidates and separates runner-up', () => {
      const result = determineWinner(candidates, { rule: 'plurality', seats: 1 });

      assert.equal(result.status, 'tie');
      assert.equal(result.isTie, true);
      assert.equal(result.winner, null);
      assert.equal(result.winners.length, 0);

      // Tied candidates: Alice and Bob
      assert.equal(result.tiedCandidates.length, 2);
      const tiedIds = result.tiedCandidates.map((c) => c.id);
      assert.ok(tiedIds.includes('cand-alice'));
      assert.ok(tiedIds.includes('cand-bob'));

      // Runner-ups: Carol
      assert.equal(result.runnerUps.length, 1);
      assert.equal(result.runnerUps[0].id, 'cand-carol');
      assert.equal(result.runnerUps[0].voteCount, 2);

      // Runoff pool must contain only top tied candidates
      assert.equal(result.runoffCandidates.length, 2);
    });
  });

  // =========================================================================
  // Scenario 3: Multi-Seat Election Boundary Tie
  // Example: 3 seats available, Top 2 clear, 3rd seat tied
  // =========================================================================
  describe('Scenario 3: Multi-Seat Boundary Tie (3 Seats)', () => {
    const candidates = [
      { id: 'cand-1', name: 'Leader One', voteCount: 10 },
      { id: 'cand-2', name: 'Leader Two', voteCount: 8 },
      { id: 'cand-3', name: 'Tied Three A', voteCount: 5 },
      { id: 'cand-4', name: 'Tied Three B', voteCount: 5 },
      { id: 'cand-5', name: 'Trailer Five', voteCount: 2 },
    ];

    test('awards clear winners and halts boundary tie for runoff resolution', () => {
      const result = determineWinner(candidates, { seats: 3 });

      assert.equal(result.status, 'tie');
      assert.equal(result.isTie, true);

      // Seats 1 and 2 awarded to Leader One and Leader Two
      assert.equal(result.winners.length, 2);
      assert.equal(result.winners[0].id, 'cand-1');
      assert.equal(result.winners[1].id, 'cand-2');

      // Seat 3 is tied between cand-3 and cand-4
      assert.equal(result.tiedCandidates.length, 2);
      const tiedIds = result.tiedCandidates.map((c) => c.id);
      assert.ok(tiedIds.includes('cand-3'));
      assert.ok(tiedIds.includes('cand-4'));

      assert.equal(result.requiresRunoff, true);
      assert.equal(result.runoffCandidates.length, 2);
    });
  });

  // =========================================================================
  // Scenario 4: Absolute Majority Rule with No Majority Candidate
  // =========================================================================
  describe('Scenario 4: Absolute Majority Requirement (>50%)', () => {
    const candidates = [
      { id: 'cand-1', name: 'Candidate 1', voteCount: 45, percentage: 45.0 },
      { id: 'cand-2', name: 'Candidate 2', voteCount: 35, percentage: 35.0 },
      { id: 'cand-3', name: 'Candidate 3', voteCount: 20, percentage: 20.0 },
    ];

    test('returns no_majority and designates top 2 candidates for runoff', () => {
      const result = determineWinner(candidates, {
        rule: 'absolute_majority',
        seats: 1,
        totalVotes: 100,
      });

      assert.equal(result.status, 'no_majority');
      assert.equal(result.winner, null);
      assert.equal(result.requiresRunoff, true);
      assert.equal(result.runoffCandidates.length, 2);
      assert.equal(result.runoffCandidates[0].id, 'cand-1');
      assert.equal(result.runoffCandidates[1].id, 'cand-2');
    });

    test('confirms clear winner when candidate achieves >50% majority', () => {
      const candidatesWin = [
        { id: 'cand-1', name: 'Candidate 1', voteCount: 55, percentage: 55.0 },
        { id: 'cand-2', name: 'Candidate 2', voteCount: 45, percentage: 45.0 },
      ];

      const result = determineWinner(candidatesWin, {
        rule: 'absolute_majority',
        seats: 1,
        totalVotes: 100,
      });

      assert.equal(result.status, 'decided');
      assert.equal(result.winner.id, 'cand-1');
      assert.equal(result.isTie, false);
      assert.equal(result.requiresRunoff, false);
    });
  });

  // =========================================================================
  // Scenario 5: Zero Votes Edge Case
  // =========================================================================
  describe('Scenario 5: Zero Votes Edge Case', () => {
    const candidates = [
      { id: 'cand-1', name: 'Candidate 1', voteCount: 0 },
      { id: 'cand-2', name: 'Candidate 2', voteCount: 0 },
    ];

    test('handles zero votes safely without throwing or declaring false tie', () => {
      const result = determineWinner(candidates, { seats: 1 });
      assert.equal(result.status, 'no_votes');
      assert.equal(result.winner, null);
      assert.equal(result.isTie, false);
      assert.equal(result.tiedCandidates.length, 0);
    });
  });
});
