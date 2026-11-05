import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_TRANSITIONS,
  canTransition,
} from '../lib/elections/lifecycle.js';

describe('VoteSphere Election Lifecycle & State Machine Unit Tests', () => {
  describe('1. State Transition Matrix Rules', () => {
    test('draft can transition to scheduled, live, or archived', () => {
      assert.ok(canTransition('draft', 'scheduled'));
      assert.ok(canTransition('draft', 'live'));
      assert.ok(canTransition('draft', 'archived'));
      assert.equal(canTransition('draft', 'ended'), false);
      assert.equal(canTransition('draft', 'published'), false);
    });

    test('scheduled can transition to draft, live, or archived', () => {
      assert.ok(canTransition('scheduled', 'draft'));
      assert.ok(canTransition('scheduled', 'live'));
      assert.ok(canTransition('scheduled', 'archived'));
      assert.equal(canTransition('scheduled', 'ended'), false);
      assert.equal(canTransition('scheduled', 'published'), false);
    });

    test('live can only transition directly to ended', () => {
      assert.ok(canTransition('live', 'ended'));
      assert.equal(canTransition('live', 'draft'), false);
      assert.equal(canTransition('live', 'scheduled'), false);
      assert.equal(canTransition('live', 'published'), false);
      assert.equal(canTransition('live', 'archived'), false);
    });

    test('ended can transition to published or archived', () => {
      assert.ok(canTransition('ended', 'published'));
      assert.ok(canTransition('ended', 'archived'));
      assert.equal(canTransition('ended', 'live'), false);
      assert.equal(canTransition('ended', 'draft'), false);
    });

    test('published can revert to ended or archive', () => {
      assert.ok(canTransition('published', 'ended'));
      assert.ok(canTransition('published', 'archived'));
      assert.equal(canTransition('published', 'live'), false);
    });

    test('archived is a closed historical state and cannot transition to draft, published, ended, or live', () => {
      assert.equal(canTransition('archived', 'draft'), false);
      assert.equal(canTransition('archived', 'published'), false);
      assert.equal(canTransition('archived', 'ended'), false);
      assert.equal(canTransition('archived', 'live'), false);
    });
  });

  describe('2. Idempotent & Edge Case Transitions', () => {
    test('transitioning from a status to the same status is always allowed', () => {
      const statuses = ['draft', 'scheduled', 'live', 'ended', 'published', 'archived'];
      for (const st of statuses) {
        assert.ok(canTransition(st, st));
      }
    });

    test('returns false for null, undefined or empty states', () => {
      assert.equal(canTransition(null, 'live'), false);
      assert.equal(canTransition('draft', null), false);
      assert.equal(canTransition(undefined, undefined), false);
      assert.equal(canTransition('', 'scheduled'), false);
    });

    test('verifies ALLOWED_TRANSITIONS definition structure completeness', () => {
      assert.ok(Array.isArray(ALLOWED_TRANSITIONS.draft));
      assert.ok(Array.isArray(ALLOWED_TRANSITIONS.scheduled));
      assert.ok(Array.isArray(ALLOWED_TRANSITIONS.live));
      assert.ok(Array.isArray(ALLOWED_TRANSITIONS.ended));
      assert.ok(Array.isArray(ALLOWED_TRANSITIONS.published));
      assert.ok(Array.isArray(ALLOWED_TRANSITIONS.archived));
    });
  });
});
