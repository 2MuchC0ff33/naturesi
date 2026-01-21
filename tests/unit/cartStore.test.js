import test from 'node:test';
import assert from 'node:assert/strict';
import { CartStore } from '../../assets/js/modules/cartStore.js';

// Simple in-memory localStorage shim
function createLocalStorageShim() {
  const store = Object.create(null);
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, val) {
      store[key] = String(val);
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

test('CartStore add/update/remove flows', async () => {
  globalThis.localStorage = createLocalStorageShim();
  const cs = new CartStore({ key: 'test-cart' });
  await cs.init();
  await cs.add({ id: 'sku-1', name: 'Tea', quantity: 1, price: 9.95 });
  let current = cs.get();
  assert.strictEqual(current.items.length, 1);
  assert.strictEqual(current.items[0].id, 'sku-1');

  // Add again increases quantity
  await cs.add({ id: 'sku-1', name: 'Tea', quantity: 2 });
  current = cs.get();
  assert.strictEqual(current.items[0].quantity, 3);

  // Update quantity to zero removes
  await cs.updateQuantity('sku-1', 0);
  current = cs.get();
  assert.strictEqual(current.items.length, 0);

  // Remove non-existing should be fine
  await cs.remove('missing', '');
  assert.ok(Array.isArray(cs.get().items));
});
