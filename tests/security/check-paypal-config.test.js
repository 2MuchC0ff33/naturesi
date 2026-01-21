import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('paypal.json contains placeholders and sandbox env by default', async () => {
  const raw = await fs.readFile('assets/js/data/paypal.json', 'utf8');
  const cfg = JSON.parse(raw);
  assert.strictEqual(cfg.env, 'sandbox');
  assert.ok(cfg.business && cfg.business.includes('@'));
});
