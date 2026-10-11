import test from 'node:test';
import assert from 'node:assert/strict';
import { selectWinningPositions } from './winnerAllocation.js';

test('allocates exactly the configured winner count without duplicate positions', () => {
  const values = [7, 19, 2, 11, 23];
  let index = 0;
  const selected = selectWinningPositions(6, 2, sample => { sample[0] = values[index++]; });
  assert.equal(selected.size, 2);
  assert.ok([...selected].every(position => position >= 0 && position < 6));
  assert.notDeepEqual([...selected].sort(), [0, 1]);
});

test('rejects impossible allocation', () => {
  assert.throws(() => selectWinningPositions(5, 6), RangeError);
});
