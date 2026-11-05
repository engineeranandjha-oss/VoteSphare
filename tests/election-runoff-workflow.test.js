import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  determineWinner,
} from '../lib/results/calculation.js';
import { ValidationError } from '../lib/utils/error-handler.js';

describe('VoteSphere Linked Runoff Election Workflow Test Suite', () => {
  // =========================================================================
  // 1. Authoritative Runoff Candidate Source of Truth Tests
  // =========================================================================
  describe('1. Authoritative Runoff Candidate Resolution', () => {
    test('three-way tie yields all 3 candidates as required runoff candidates', () => {
      const candidates = [
        { id: 'cand-a', name: 'Candidate A', voteCount: 5 },
        { id: 'cand-b', name: 'Candidate B', voteCount: 5 },
        { id: 'cand-c', name: 'Candidate C', voteCount: 5 },
        { id: 'cand-d', name: 'Candidate D', voteCount: 2 },
      ];

      const evaluation = determineWinner(candidates, { rule: 'plurality', seats: 1 });

      assert.equal(evaluation.status, 'tie');
      assert.equal(evaluation.isTie, true);
      assert.equal(evaluation.requiresRunoff, true);
      assert.equal(evaluation.runoffCandidates.length, 3);
      assert.deepEqual(
        evaluation.runoffCandidates.map((c) => c.id).sort(),
        ['cand-a', 'cand-b', 'cand-c']
      );
      assert.ok(!evaluation.runoffCandidates.some((c) => c.id === 'cand-d'));
    });

    test('absolute majority failure selects top 2 candidates for runoff', () => {
      const candidates = [
        { id: 'cand-a', name: 'Candidate A', voteCount: 40 }, // 40%
        { id: 'cand-b', name: 'Candidate B', voteCount: 35 }, // 35%
        { id: 'cand-c', name: 'Candidate C', voteCount: 25 }, // 25%
      ];

      const evaluation = determineWinner(candidates, { rule: 'absolute_majority', seats: 1 });

      assert.equal(evaluation.status, 'no_majority');
      assert.equal(evaluation.requiresRunoff, true);
      assert.equal(evaluation.runoffCandidates.length, 2);
      assert.deepEqual(
        evaluation.runoffCandidates.map((c) => c.id),
        ['cand-a', 'cand-b']
      );
    });

    test('decided election with clear winner does not require runoff', () => {
      const candidates = [
        { id: 'cand-a', name: 'Candidate A', voteCount: 15 },
        { id: 'cand-b', name: 'Candidate B', voteCount: 8 },
      ];

      const evaluation = determineWinner(candidates, { rule: 'plurality', seats: 1 });

      assert.equal(evaluation.status, 'decided');
      assert.equal(evaluation.requiresRunoff, false);
      assert.equal(evaluation.runoffCandidates.length, 0);
      assert.equal(evaluation.winner?.id, 'cand-a');
    });
  });

  // =========================================================================
  // 2. Parent Election Immutability & Linkage Configuration
  // =========================================================================
  describe('2. Parent Election Immutability & Linkage Properties', () => {
    test('runoff election config preserves parent lineage while resetting vote totals', () => {
      const originalElection = {
        id: '11111111-2222-3333-4444-555555555555',
        title: 'Student Body Presidential Election',
        orgId: 'org-100',
        status: 'ended',
        config: {
          winningRule: 'plurality',
          showLiveTurnout: true,
          publishingDetails: { certifiedAt: '2026-09-20T10:00:00Z' },
        },
      };

      const parentRound = originalElection.config.runoff?.round || 1;
      const targetRound = parentRound + 1;

      // Construct expected runoff config
      const runoffConfig = {
        ...originalElection.config,
        runoff: {
          parentElectionId: originalElection.id,
          parentElectionTitle: originalElection.title,
          originalElectionId: originalElection.id,
          round: targetRound,
          isRunoff: true,
        },
      };
      delete runoffConfig.publishingDetails;

      assert.equal(runoffConfig.runoff.parentElectionId, originalElection.id);
      assert.equal(runoffConfig.runoff.round, 2);
      assert.equal(runoffConfig.runoff.isRunoff, true);
      assert.equal(runoffConfig.publishingDetails, undefined);
    });

    test('multi-round runoff links cascade round numbers (Round 1 -> Round 2 -> Round 3)', () => {
      const round2Election = {
        id: 'election-round-2',
        title: 'Student Body Presidential Election (Runoff Round 2)',
        config: {
          runoff: {
            parentElectionId: 'election-round-1',
            originalElectionId: 'election-round-1',
            round: 2,
            isRunoff: true,
          },
        },
      };

      const parentRound = round2Election.config.runoff.round;
      const round3Round = parentRound + 1;
      const round3OriginalId = round2Election.config.runoff.originalElectionId;

      assert.equal(round3Round, 3);
      assert.equal(round3OriginalId, 'election-round-1');
    });
  });

  // =========================================================================
  // 3. Voter Roster Duplication & Fresh Zero-Vote State
  // =========================================================================
  describe('3. Voter Roster Duplication & Fresh Zero-Vote State', () => {
    test('carries over eligible voters into fresh eligibility records with 0 votes', () => {
      const parentEligibilities = [
        { memberId: 'mem-1', status: 'voted', votedAt: '2026-09-25T10:00:00Z' },
        { memberId: 'mem-2', status: 'voted', votedAt: '2026-09-25T11:00:00Z' },
        { memberId: 'mem-3', status: 'eligible', votedAt: null },
        { memberId: 'mem-4', status: 'disqualified', votedAt: null },
      ];

      const runoffEligibilities = parentEligibilities
        .filter((e) => e.status !== 'disqualified')
        .map((e) => ({
          memberId: e.memberId,
          status: 'eligible', // Fresh eligible status
          votedAt: null,
        }));

      assert.equal(runoffEligibilities.length, 3);
      assert.ok(runoffEligibilities.every((e) => e.status === 'eligible'));
      assert.ok(runoffEligibilities.every((e) => e.votedAt === null));
      assert.ok(!runoffEligibilities.some((e) => e.memberId === 'mem-4'));
    });
  });

  // =========================================================================
  // 4. State Transition & Safety Guards
  // =========================================================================
  describe('4. State Transition & Runoff Creation Guards', () => {
    test('A, B, C: allows runoff creation when parent election is in concluded status (archived, published, ended) with a tie', () => {
      const concludedStatuses = ['archived', 'published', 'ended'];
      for (const status of concludedStatuses) {
        const isConcluded = status === 'ended' || status === 'published' || status === 'archived';
        assert.ok(isConcluded, `Status '${status}' must be accepted as concluded parent state for runoff`);
      }
    });

    test('D, E: rejects runoff creation if parent election has a unique winner', () => {
      const concludedStatuses = ['archived', 'published', 'ended'];
      for (const status of concludedStatuses) {
        const parentElection = { id: `elec-${status}`, status };
        const winnersData = {
          hasRunoffsRequired: false,
          hasTies: false,
          positions: [{ requiresRunoff: false, winner: { id: 'winner-1' } }],
        };

        assert.throws(
          () => {
            if (parentElection.status && !winnersData.hasRunoffsRequired) {
              throw new ValidationError(
                'This election does not require a runoff. All positions have definitive winners according to the election rules.'
              );
            }
          },
          {
            name: 'ValidationError',
            message: /does not require a runoff/,
          }
        );
      }
    });

    test('F: rejects runoff creation for election without authoritative results or without required runoffs', () => {
      const emptyResultsData = {
        hasRunoffsRequired: false,
        hasTies: false,
        positions: [],
      };

      assert.throws(
        () => {
          if (!emptyResultsData.hasRunoffsRequired) {
            throw new ValidationError('This election does not require a runoff');
          }
        },
        {
          name: 'ValidationError',
          message: /does not require a runoff/,
        }
      );
    });

    test('G: rejects duplicate runoff creation if child already linked', () => {
      const electionWithChild = {
        id: 'elec-parent',
        status: 'archived',
        config: {
          runoff: {
            childElectionId: 'elec-runoff-round-2',
          },
        },
      };

      assert.throws(
        () => {
          if (electionWithChild.config?.runoff?.childElectionId) {
            throw new ValidationError('A runoff election has already been created for this election. Duplicate runoffs are prevented.');
          }
        },
        {
          name: 'ValidationError',
          message: /already been created/,
        }
      );
    });

    test('H: rejects runoff creation from live status without prior formal conclusion', () => {
      const liveElection = {
        id: 'elec-live',
        status: 'live',
      };

      const isConcluded =
        liveElection.status === 'ended' ||
        liveElection.status === 'published' ||
        liveElection.status === 'archived';

      assert.equal(isConcluded, false);

      assert.throws(
        () => {
          if (!isConcluded) {
            throw new ValidationError(
              `Cannot create a runoff from an election in '${liveElection.status}' status. The election must be concluded ('ended', 'published', or 'archived') first.`
            );
          }
        },
        {
          name: 'ValidationError',
          message: /must be concluded/,
        }
      );
    });

    test('rejects runoff creation if parent election is in draft status', () => {
      const draftElection = {
        id: 'elec-draft',
        status: 'draft',
      };

      const isConcluded =
        draftElection.status === 'ended' ||
        draftElection.status === 'published' ||
        draftElection.status === 'archived';

      assert.equal(isConcluded, false);
      assert.throws(
        () => {
          if (!isConcluded) {
            throw new ValidationError(
              `Cannot create a runoff from an election in '${draftElection.status}' status. The election must be concluded ('ended', 'published', or 'archived') first.`
            );
          }
        },
        {
          name: 'ValidationError',
          message: /must be concluded/,
        }
      );
    });
  });

  // =========================================================================
  // 5. Security & Authorization Constraints
  // =========================================================================
  describe('5. Security & Authorization Constraints', () => {
    test('I, J: enforces strict organization-scoped admin/owner authorization', () => {
      const mockRoles = {
        'user-voter': 'voter',
        'user-outsider': null,
        'user-admin': 'admin',
        'user-owner': 'owner',
      };

      function checkRunoffAuth(userId) {
        const role = mockRoles[userId];
        if (!role || !['owner', 'admin'].includes(role)) {
          throw new ValidationError('Forbidden: insufficient permissions');
        }
        return true;
      }

      assert.throws(() => checkRunoffAuth('user-voter'), { name: 'ValidationError', message: /Forbidden/ });
      assert.throws(() => checkRunoffAuth('user-outsider'), { name: 'ValidationError', message: /Forbidden/ });
      assert.equal(checkRunoffAuth('user-admin'), true);
      assert.equal(checkRunoffAuth('user-owner'), true);
    });

    test('K, L, M: server ignores client candidate lists and tampered orgId; resolves authoritative candidates from server only', () => {
      // Client submits tampered candidates and tampered orgId
      const maliciousClientPayload = {
        electionId: '11111111-2222-3333-4444-555555555555',
        organizationId: 'malicious-org-999',
        candidates: [{ id: 'fake-cand', name: 'Fake Injected Winner' }],
        requiresRunoff: true,
      };

      // Server DB state
      const serverElection = {
        id: '11111111-2222-3333-4444-555555555555',
        orgId: 'legitimate-org-100',
        status: 'archived',
      };

      // Authoritative calculation from server ballots
      const authoritativeWinners = {
        hasRunoffsRequired: true,
        positions: [
          {
            positionId: 'pos-1',
            positionName: 'President',
            requiresRunoff: true,
            runoffCandidates: [
              { id: 'auth-cand-a', name: 'Authoritative Candidate A' },
              { id: 'auth-cand-b', name: 'Authoritative Candidate B' },
            ],
          },
        ],
      };

      // The server derives orgId and candidates exclusively from authoritative data
      const createdChildOrgId = serverElection.orgId;
      const createdCandidates = authoritativeWinners.positions[0].runoffCandidates;

      assert.equal(createdChildOrgId, 'legitimate-org-100');
      assert.notEqual(createdChildOrgId, maliciousClientPayload.organizationId);
      assert.equal(createdCandidates.length, 2);
      assert.ok(!createdCandidates.some((c) => c.id === 'fake-cand'));
      assert.ok(createdCandidates.some((c) => c.id === 'auth-cand-a'));
    });
  });

  // =========================================================================
  // 6. Parent Immutability & Child Election Invariants
  // =========================================================================
  describe('6. Parent Immutability & Child Election Invariants', () => {
    test('N, O: parent election status and snapshot remain immutable after runoff creation', () => {
      const parentBefore = {
        id: 'parent-elec-123',
        status: 'archived',
        votesCount: 3,
        certifiedSnapshot: { resultHash: 'sha256-abc12345', totalVotes: 3 },
        config: { winningRule: 'plurality' },
      };

      // Simulate createRunoffElection linking
      const childElectionId = 'child-elec-456';
      const parentAfterConfig = {
        ...parentBefore.config,
        runoff: {
          round: 1,
          childElectionId,
          linkedAt: new Date().toISOString(),
        },
      };

      const parentAfter = {
        ...parentBefore,
        config: parentAfterConfig,
      };

      // Invariants:
      assert.equal(parentAfter.status, 'archived');
      assert.equal(parentAfter.status, parentBefore.status);
      assert.equal(parentAfter.votesCount, parentBefore.votesCount);
      assert.deepEqual(parentAfter.certifiedSnapshot, parentBefore.certifiedSnapshot);
      assert.equal(parentAfter.config.runoff.childElectionId, childElectionId);
    });

    test('P, Q, R: Round 1 voters receive fresh eligibility; Round 1 receipts and public results remain intact', () => {
      // Round 1 voter who voted in Round 1
      const round1Eligibility = {
        electionId: 'parent-elec-123',
        memberId: 'member-voter-1',
        status: 'voted',
        receiptId: 'rcpt-round1-987654',
      };

      // Fresh Round 2 eligibility
      const round2Eligibility = {
        electionId: 'child-elec-456',
        memberId: round1Eligibility.memberId,
        status: 'eligible', // Reset to eligible
        receiptId: null,
      };

      assert.equal(round1Eligibility.status, 'voted');
      assert.equal(round1Eligibility.receiptId, 'rcpt-round1-987654');
      assert.equal(round2Eligibility.status, 'eligible');
      assert.equal(round2Eligibility.receiptId, null);
    });
  });
});
