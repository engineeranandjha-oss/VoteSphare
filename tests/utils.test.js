import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cn } from '../lib/utils.js';

describe('VoteSphere Utility Helper Unit Tests', () => {
  describe('1. ClassName Merger (cn)', () => {
    test('merges standard class strings', () => {
      const result = cn('btn', 'btn-primary');
      assert.equal(result, 'btn btn-primary');
    });

    test('properly resolves conflicting Tailwind classes with twMerge', () => {
      const result = cn('px-2 py-1 bg-red-500', 'px-4 bg-blue-500');
      assert.equal(result, 'py-1 px-4 bg-blue-500');
    });

    test('ignores falsy, null, and undefined values cleanly', () => {
      const result = cn('base-class', false && 'hidden', null, undefined, 'active-class');
      assert.equal(result, 'base-class active-class');
    });

    test('handles object conditions properly', () => {
      const result = cn('badge', { 'badge-success': true, 'badge-danger': false });
      assert.equal(result, 'badge badge-success');
    });
  });
});
