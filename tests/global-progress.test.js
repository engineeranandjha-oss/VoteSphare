import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createProgressManager } from '../lib/utils/progress-manager.js';

describe('Global Yellow Progress & Interaction Lifecycle Test Suite', () => {
  describe('1. Progress State Initialization', () => {
    it('initializes with zero progress, zero active operations, and hidden state', () => {
      const manager = createProgressManager();
      assert.equal(manager.getProgress(), 0);
      assert.equal(manager.getActiveCount(), 0);
      assert.equal(manager.isVisible(), false);
    });

    it('accepts custom initial progress when provided', () => {
      const manager = createProgressManager(10);
      assert.equal(manager.getProgress(), 10);
    });
  });

  describe('2. Single Operation Lifecycle', () => {
    it('starts progress and immediately moves to initial threshold (~18%)', () => {
      const manager = createProgressManager();
      const state = manager.start();

      assert.equal(state.activeOperations, 1);
      assert.equal(state.visible, true);
      assert.equal(state.isNewSession, true);
      assert.ok(state.progress >= 18);
    });

    it('completes progress to 100% when operation finishes', () => {
      const manager = createProgressManager();
      manager.start();
      const result = manager.complete();

      assert.equal(result.activeOperations, 0);
      assert.equal(result.progress, 100);
      assert.equal(result.isFinished, true);
    });

    it('fails gracefully and completes to 100% without leaving state stuck', () => {
      const manager = createProgressManager();
      manager.start();
      const result = manager.fail();

      assert.equal(result.activeOperations, 0);
      assert.equal(result.progress, 100);
      assert.equal(result.isFinished, true);
    });
  });

  describe('3. Multi-Operation Concurrent Reference Counting', () => {
    it('keeps progress active while concurrent operations are in flight', () => {
      const manager = createProgressManager();

      // Operation A starts (e.g. Save Settings)
      const opA = manager.start();
      assert.equal(opA.activeOperations, 1);
      assert.equal(manager.getActiveCount(), 1);

      // Operation B starts concurrently (e.g. Background verification / Route push)
      const opB = manager.start();
      assert.equal(opB.activeOperations, 2);
      assert.equal(manager.getActiveCount(), 2);

      // Operation A finishes
      const finishA = manager.complete();
      assert.equal(finishA.activeOperations, 1);
      assert.equal(finishA.isFinished, false); // Must NOT finish yet because B is still running!
      assert.ok(manager.getProgress() < 100);

      // Operation B finishes
      const finishB = manager.complete();
      assert.equal(finishB.activeOperations, 0);
      assert.equal(finishB.isFinished, true); // Now finished
      assert.equal(finishB.progress, 100);
    });

    it('handles 5 simultaneous concurrent operations smoothly', () => {
      const manager = createProgressManager();

      for (let i = 0; i < 5; i++) {
        manager.start();
      }
      assert.equal(manager.getActiveCount(), 5);

      // Complete first 4
      for (let i = 0; i < 4; i++) {
        const res = manager.complete();
        assert.equal(res.isFinished, false);
      }
      assert.equal(manager.getActiveCount(), 1);

      // Complete last one
      const finalRes = manager.complete();
      assert.equal(finalRes.activeOperations, 0);
      assert.equal(finalRes.isFinished, true);
      assert.equal(finalRes.progress, 100);
    });
  });

  describe('4. Asymptotic Step Progression', () => {
    it('advances smoothly and asymptotically without exceeding 95% before completion', () => {
      const manager = createProgressManager();
      manager.start();

      let lastProgress = manager.getProgress();

      // Simulate multiple step ticks
      for (let i = 0; i < 50; i++) {
        const next = manager.step();
        assert.ok(next >= lastProgress, 'Progress must never decrease during active ticking');
        assert.ok(next <= 95, 'Progress must not exceed 95% before completion');
        lastProgress = next;
      }
    });

    it('does not advance if progress is inactive', () => {
      const manager = createProgressManager();
      const val = manager.step();
      assert.equal(val, 0);
    });
  });

  describe('5. withProgress Async Function Wrapper', () => {
    it('executes successful async function and automatically completes progress', async () => {
      const manager = createProgressManager();
      assert.equal(manager.getActiveCount(), 0);

      let executed = false;
      const result = await manager.withProgress(async () => {
        assert.equal(manager.getActiveCount(), 1);
        assert.equal(manager.isVisible(), true);
        executed = true;
        return 'success-payload';
      });

      assert.equal(executed, true);
      assert.equal(result, 'success-payload');
      assert.equal(manager.getActiveCount(), 0);
      assert.equal(manager.getProgress(), 100);
    });

    it('ensures complete is called even when async function throws error', async () => {
      const manager = createProgressManager();

      await assert.rejects(
        async () => {
          await manager.withProgress(async () => {
            assert.equal(manager.getActiveCount(), 1);
            throw new Error('API connection timed out');
          });
        },
        {
          message: 'API connection timed out',
        }
      );

      // Progress counter MUST have decremented and completed to avoid hanging state
      assert.equal(manager.getActiveCount(), 0);
      assert.equal(manager.getProgress(), 100);
    });
  });

  describe('6. Reset and Edge Cases', () => {
    it('resets cleanly to 0 on explicit reset call', () => {
      const manager = createProgressManager();
      manager.start();
      manager.start();
      assert.equal(manager.getActiveCount(), 2);

      const resetState = manager.reset();
      assert.equal(resetState.activeOperations, 0);
      assert.equal(resetState.progress, 0);
      assert.equal(resetState.visible, false);
    });

    it('prevents activeCount from dropping below 0 on extra complete calls', () => {
      const manager = createProgressManager();
      manager.complete();
      manager.complete();
      assert.equal(manager.getActiveCount(), 0);
    });
  });
});
