import test from 'node:test';
import assert from 'node:assert/strict';
import { nextInvoiceNumber } from './invoiceNumbers.js';

test('uses the highest persisted invoice even when older numbers are duplicated', () => {
  assert.equal(nextInvoiceNumber(['INV-0001', 'INV-0001', 'INV-0017']), 'INV-0018');
});

test('ignores unrelated invoice names and preserves padding', () => {
  assert.equal(nextInvoiceNumber(['draft-22', 'INV-0999']), 'INV-1000');
  assert.equal(nextInvoiceNumber([]), 'INV-0001');
});
