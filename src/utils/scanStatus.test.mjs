import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidQrId } from './scanStatus.js';

test('accepts a sticker UUID and rejects missing or malformed IDs', () => {
  assert.equal(isValidQrId('123e4567-e89b-42d3-a456-426614174000'), true);
  assert.equal(isValidQrId(''), false);
  assert.equal(isValidQrId('forged'), false);
  assert.equal(isValidQrId('123e4567-e89b-42d3-a456-426614174000?coupon=FREE'), false);
});
