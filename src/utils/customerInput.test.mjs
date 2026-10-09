import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCustomerInput } from './customerInput.js';

test('accepts and normalizes a customer name and international phone', () => {
  assert.deepEqual(normalizeCustomerInput('  தமிழ்   பெயர் ', '+91 98765 43210'), {
    name: 'தமிழ் பெயர்', phone: '919876543210'
  });
});

test('rejects empty names and malformed phone numbers', () => {
  assert.match(normalizeCustomerInput(' ', '919876543210').error, /name/);
  assert.match(normalizeCustomerInput('Customer', '123<script>').error, /phone/);
});
