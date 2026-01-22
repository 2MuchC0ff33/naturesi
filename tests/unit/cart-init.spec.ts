import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initCart } from '../../assets/js/modules/cart-init.js';

beforeEach(() => {
  document.body.innerHTML =
    '<output name="cart-count">0</output><table class="cart-table"><tbody></tbody></table><p id="summary-subtotal"></p><p id="summary-total"></p>';
  localStorage.clear();
});

describe('initCart', () => {
  it('initializes store, renders cart table and updates count when cart present in localStorage', async () => {
    // put a known cart into localStorage
    localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([{ id: 'p1', name: 'T1', price: 2, qty: 2 }])
    );

    // mock products fetch to return sample products
    globalThis.fetch = vi.fn(async (path) => {
      if (path && (path as string).endsWith('products.json'))
        return { ok: true, json: async () => [{ id: 'p1', title: 'T1', price: 2 }] };
      return { ok: false };
    }) as unknown as typeof fetch;

    const store = await initCart();
    expect(store).toBeTruthy();
    // check that cart table now has a row
    const rows = document.querySelectorAll('.cart-table tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    const out = document.querySelector('output[name="cart-count"]');
    expect(out.textContent).toMatch(/\d+/);
  });
});
