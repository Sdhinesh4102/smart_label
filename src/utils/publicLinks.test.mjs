import test from 'node:test';
import assert from 'node:assert/strict';
import { safeHttpUrl, socialUrl, whatsappUrl } from './publicLinks.js';

test('customer page links accept only web protocols', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), null);
  assert.equal(safeHttpUrl('data:text/html,hi'), null);
  assert.equal(safeHttpUrl('https://example.com/shop'), 'https://example.com/shop');
});

test('social and WhatsApp URLs reject injected paths', () => {
  assert.equal(socialUrl('instagram', '@my_shop'), 'https://instagram.com/my_shop');
  assert.equal(socialUrl('instagram', 'shop?next=evil'), null);
  assert.equal(whatsappUrl('+91 98765 43210', 'Hello!'), 'https://wa.me/919876543210?text=Hello!');
  assert.equal(whatsappUrl('123;evil', 'Hello'), null);
});
