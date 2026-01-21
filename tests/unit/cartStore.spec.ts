import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../assets/js/modules/storageLocal.js', () => ({
  getLocalCart: vi.fn(() => null),
  setLocalCart: vi.fn(() => true),
}));

vi.mock('../../assets/js/modules/storageIDB.js', () => ({
  loadCartFromIDB: vi.fn(async () => ({ items: [] })),
  saveCartToIDB: vi.fn(async () => true),
}));

import { CartStore } from '../../assets/js/modules/cartStore.js';
import { getLocalCart, setLocalCart } from '../../assets/js/modules/storageLocal.js';
import { loadCartFromIDB, saveCartToIDB } from '../../assets/js/modules/storageIDB.js';

describe('CartStore', () => {
  let store;
  beforeEach(async () => {
    // ensure mocks reset
    vi.clearAllMocks();
    store = new CartStore({ key: 'test-cart' });
  });

  it('init loads from IDB when localStorage empty', async () => {
    getLocalCart.mockReturnValue(null);
    loadCartFromIDB.mockResolvedValue({ items: [] });
    const c = await store.init();
    expect(c).toHaveProperty('items');
  });

  it('add adds new item and persists', async () => {
    await store.init();
    await store.add({ id: 'a', name: 'A', price: 5, quantity: 2 });
    expect(store.get().items.find((it) => it.id === 'a')).toBeTruthy();
    expect(setLocalCart).toHaveBeenCalled();
  });

  it('updateQuantity removes item when quantity <= 0', async () => {
    await store.init();
    await store.add({ id: 'b', name: 'B', price: 1, quantity: 1 });
    await store.updateQuantity('b', 0);
    const found = store.get().items.find((it) => it.id === 'b');
    expect(found).toBeUndefined();
  });
});
