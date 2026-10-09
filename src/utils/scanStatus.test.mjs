import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyScan } from './scanStatus.js';

const clientId = 'shop-a';
const qrId = '123e4567-e89b-42d3-a456-426614174000';

test('a store page without a sticker QR cannot show a prize', () => {
  assert.equal(classifyScan(clientId, '', null), 'invalid');
  assert.equal(classifyScan(clientId, 'forged', null), 'invalid');
});

test('a QR issued for another store is rejected', () => {
  assert.equal(classifyScan(clientId, qrId, { clientId: 'another-store', isWinner: true }), 'invalid');
});

test('older unrecorded losing stickers remain non-winning', () => {
  assert.equal(classifyScan(clientId, qrId, null), 'legacy_loser');
});

test('newly recorded winner and loser QRs both have one-time state', () => {
  assert.equal(classifyScan(clientId, qrId, { clientId, isWinner: true, isClaimed: false }), 'winner');
  assert.equal(classifyScan(clientId, qrId, { clientId, isWinner: false, isClaimed: false }), 'loser');
  assert.equal(classifyScan(clientId, qrId, { clientId, isWinner: false, isClaimed: true }), 'claimed');
});
