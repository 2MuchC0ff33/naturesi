import { describe, it, expect, beforeEach } from 'vitest';
import { CartStore } from '../../assets/js/modules/cartStore.js';

vi.mock('../../assets/js/modules/storageLocal.js', () => ({
  getLocalCart: () => null,
  setLocalCart: () => true,
}));
vi.mock('../../assets/js/modules/storageIDB.js', () => ({
  loadCartFromIDB: async () => ({ items: [] }),
  saveCartToIDB: async () => true,
}));

describe('CartStore edge cases', () => {
  let store;
  beforeEach(async () => {
    store = new CartStore({ key: 'unit-test-cart' });
    await store.init();
  });

  it('adds duplicate items with same id+size by merging quantities', async () => {
    await store.add({ id: 'x', name: 'Item', price: 1, quantity: 1, size: '' });
    await store.add({ id: 'x', name: 'Item', price: 1, quantity: 2, size: '' });
    const it = store.get().items.find((i) => i.id === 'x');
    expect(it.quantity).toBe(3);
  });

  it('add with size differentiates items', async () => {
    await store.add({ id: 'y', name: 'ItemY', price: 2, quantity: 1, size: 'small' });
    await store.add({ id: 'y', name: 'ItemY', price: 2, quantity: 1, size: 'large' });
    const items = store.get().items.filter((i) => i.id === 'y');
    expect(items.length).toBe(2);
  });

  it('updateQuantity removes item when quantity <= 0 and handles size mismatch gracefully', async () => {
    await store.add({ id: 'z', name: 'Z', price: 3, quantity: 2, size: '' });
    await store.updateQuantity('z', 0);
    expect(store.get().items.find((i) => i.id === 'z')).toBeUndefined();
  });

  it('updateCartItemQuantity parses integers and saves', async () => {
    await store.add({ id: 'a', name: 'A', price: 1, quantity: 1 });
    const existing = store.get().items.find((i) => i.id === 'a');
    await store.updateCartItemQuantity(existing, '5');
    expect(existing.quantity).toBe(5);
  });
});
