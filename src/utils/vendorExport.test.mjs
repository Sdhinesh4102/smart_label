import test from 'node:test';
import assert from 'node:assert/strict';
import { createVendorCsv } from './vendorExport.js';

test('vendor CSV includes every unique QR and 50 × 30 mm label size', () => {
  const csv = createVendorCsv({
    runId: 'batch-1',
    clientName: 'Juice Shop',
    promoText: 'Scan & Win',
    codes: [
      { stickerNumber: 1, targetUrl: 'https://example.com/?qr_id=first', isWinner: true },
      { stickerNumber: 2, targetUrl: 'https://example.com/?qr_id=second', isWinner: false }
    ]
  });
  assert.equal(csv.trim().split('\r\n').length, 3);
  assert.match(csv, /qr_id=first/);
  assert.match(csv, /qr_id=second/);
  assert.match(csv, /"50","30"/);
  assert.doesNotMatch(csv, /winner/i);
});

test('vendor CSV quotes special characters and neutralizes spreadsheet formulas', () => {
  const csv = createVendorCsv({
    runId: 'batch-2', clientName: '=1+1', promoText: 'Say "Hi", scan',
    codes: [{ stickerNumber: 1, targetUrl: 'https://example.com/qr' }]
  });
  assert.match(csv, /"'=1\+1"/);
  assert.match(csv, /"Say ""Hi"", scan"/);
});
