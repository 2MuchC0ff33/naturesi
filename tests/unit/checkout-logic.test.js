import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCartRaw,
  computeGrandTotal,
  computeItemLabel,
  buildPayPalPayload,
} from '../../assets/js/modules/checkout.js';

const sampleCart = [
  { id: 'sku-1', title: 'Chamomile', price: 9.95, qty: 2 },
  { id: 'sku-2', title: 'Eucalyptus', price: 6.5, qty: 1 },
];

test('parseCartRaw handles JSON and arrays', () => {
  const raw = JSON.stringify(sampleCart);
  const parsed = parseCartRaw(raw);
  assert.strictEqual(Array.isArray(parsed), true);
  assert.strictEqual(parsed.length, 2);
});

// HTML-first policy: tests that only need parsing should stay as fast unit tests.
// Added test that verifies empty cart handling without relying on global localStorage.
test('parseCartRaw handles empty cart raw string', () => {
  const raw = JSON.stringify([]);
  const parsed = parseCartRaw(raw);
  assert.strictEqual(Array.isArray(parsed), true);
  assert.strictEqual(parsed.length, 0);
});

test('computeGrandTotal calculates totals correctly', () => {
  const total = computeGrandTotal(sampleCart);
  assert.strictEqual(total, 9.95 * 2 + 6.5 * 1);
});

test('computeItemLabel creates concise labels', () => {
  const label = computeItemLabel(sampleCart);
  assert.ok(label.includes('2×Chamomile'));
  assert.ok(label.includes('1×Eucalyptus'));
});

test('buildPayPalPayload validates cfg and builds payload', () => {
  const cfg = {
    env: 'sandbox',
    business: 'sandbox@example.com',
    currency: 'AUD',
    sandbox_url: 'https://sandbox',
    return_path: '/success',
    cancel_path: '/fail',
  };
  const { payload, errors } = buildPayPalPayload(cfg, sampleCart);
  assert.strictEqual(errors.length, 0);
  assert.strictEqual(payload.business, 'sandbox@example.com');
  assert.strictEqual(payload.amount, (9.95 * 2 + 6.5).toFixed(2));
});

test('buildPayPalPayload returns errors when business missing', () => {
  const cfg = { env: 'sandbox', business: '', currency: 'AUD', sandbox_url: 'https://sandbox' };
  const { payload, errors } = buildPayPalPayload(cfg, sampleCart);
  assert.ok(errors.length > 0);
});
