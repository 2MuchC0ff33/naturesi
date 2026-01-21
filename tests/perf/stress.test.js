import test from 'node:test';
import assert from 'node:assert/strict';
import { CartStore } from '../../assets/js/modules/cartStore.js';

test('stress add/remove loop does not crash', { skip: !process.env.RUN_SLOW_TESTS }, async () => {
  globalThis.localStorage = {
    _store: {},
    getItem(k) {
      return this._store[k] ?? null;
    },
    setItem(k, v) {
      this._store[k] = String(v);
    },
    removeItem(k) {
      delete this._store[k];
    },
  };
  const cs = new CartStore({ key: 'stress-cart' });
  await cs.init();
  for (let i = 0; i < 1000; i++) {
    await cs.add({ id: `sku-${i}`, name: 'T', quantity: 1 });
  }
  const len = cs.get().items.length;
  assert.strictEqual(len, 1000);
  // remove half
  for (let i = 0; i < 500; i++) {
    await cs.remove(`sku-${i}`, '');
  }
  assert.strictEqual(cs.get().items.length, 500);
});
