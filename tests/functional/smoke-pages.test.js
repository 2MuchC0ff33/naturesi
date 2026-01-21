import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('checkout page contains paypal form and summary content', async () => {
  const html = await fs.readFile('pages/checkout.html', 'utf8');
  assert.ok(html.includes('id="paypal-form"'));
  assert.ok(html.includes('id="summary-content"'));
});

test('payment success and fail pages present and linkable', async () => {
  const s = await fs.readFile('pages/payment/success.html', 'utf8');
  const f = await fs.readFile('pages/payment/fail.html', 'utf8');
  assert.ok(s.includes('Payment completed'));
  assert.ok(f.includes('Payment cancelled'));
});

test('paypal.json has required keys', async () => {
  const cfg = JSON.parse(await fs.readFile('assets/js/data/paypal.json', 'utf8'));
  assert.ok(cfg.env);
  assert.ok(cfg.sandbox_url);
  assert.ok(cfg.return_path);
});
