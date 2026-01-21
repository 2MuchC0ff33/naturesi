import test from 'node:test';
import assert from 'node:assert/strict';
import { toNumber, normalizeItem } from '../../assets/js/modules/cart.js';

test('toNumber converts various inputs to numbers with fallback', () => {
  assert.strictEqual(toNumber('10'), 10);
  assert.strictEqual(toNumber('  3.50 '), 3.5);
  assert.strictEqual(toNumber('bad', 7), 7);
  assert.strictEqual(toNumber(undefined, 0), 0);
});

test('normalizeItem returns canonical object or undefined for invalids', () => {
  const ok = normalizeItem({ id: 'sku-1', title: 'Tea', price: '9.95', qty: '2' });
  assert.deepStrictEqual(ok, { id: 'sku-1', title: 'Tea', price: 9.95, qty: 2 });

  const missing = normalizeItem({ id: '', title: '', price: 10, qty: 1 });
  assert.strictEqual(missing, undefined);

  const zeroQty = normalizeItem({ id: 'a', title: 'b', price: 5, qty: 0 });
  assert.strictEqual(zeroQty, undefined);
});
