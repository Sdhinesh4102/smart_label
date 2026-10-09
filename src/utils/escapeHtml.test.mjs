import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './escapeHtml.js';
import { csvCell } from './vendorExport.js';

test('invoice exports escape untrusted store names', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(csvCell('=HYPERLINK("https://evil")'), '"\'=HYPERLINK(""https://evil"")"');
});
