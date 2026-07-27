import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MemoryStorage } from './helpers.js';

globalThis.localStorage = new MemoryStorage();

const { isConfirmedDoubleTap } = await import('../../../src/soloDraw.js');

test('accepts a nearby second tap inside the confirmation window', () => {
  assert.equal(
    isConfirmedDoubleTap(
      { time: 100, x: 200, y: 120 },
      { time: 700, x: 272, y: 120 },
    ),
    true,
  );
});

test('rejects taps that are late, too far away, missing, or out of order', () => {
  const first = { time: 100, x: 200, y: 120 };

  assert.equal(isConfirmedDoubleTap(first, { time: 701, x: 200, y: 120 }), false);
  assert.equal(isConfirmedDoubleTap(first, { time: 200, x: 273, y: 120 }), false);
  assert.equal(isConfirmedDoubleTap(null, { time: 200, x: 200, y: 120 }), false);
  assert.equal(isConfirmedDoubleTap(first, { time: 99, x: 200, y: 120 }), false);
});
