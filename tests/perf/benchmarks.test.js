import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { computeGrandTotal } from '../../assets/js/modules/checkout.js';

test('computeGrandTotal performance basic', () => {
  const cart = Array.from({ length: 1000 }, (_, i) => ({
    id: `i${i}`,
    title: 'x',
    price: 1.23,
    qty: 2,
  }));
  const start = performance.now();
  const total = computeGrandTotal(cart);
  const ms = performance.now() - start;
  assert.strictEqual(total > 0, true);
  // Avoid brittle CI failures: default threshold is generous but can be
  // tightened by setting PERF_THRESHOLD_MS in CI or locally.
  const threshold = Number(process.env.PERF_THRESHOLD_MS || 1000);
  assert.ok(ms < threshold, `computeGrandTotal took ${ms}ms, threshold ${threshold}ms`);
});
