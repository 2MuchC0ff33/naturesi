import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../assets/js/modules/cartStore.js', () => ({
  calculateParcelRate: vi.fn(async () => ({ zone: 'nearMetro', rate: 6 })),
  calculateShippingByWeight: vi.fn(async () => ({
    parcelType: 'pouch',
    zone: 'nearMetro',
    totalRate: 6,
  })),
}));

import {
  setProductIndex,
  updateCartCountOutputs,
  renderCartTable,
  updateCartTableTotals,
  updateCartTableTotalsWithShipping,
  displayShippingEstimate,
} from '../../assets/js/modules/cartUI.js';

describe('cartUI helpers', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<output name="cart-count">0</output><table class="cart-table"><tbody></tbody></table><p id="summary-subtotal"></p><p id="summary-total"></p><p id="summary-shipping"></p>';
  });

  it('updateCartCountOutputs updates all outputs', () => {
    updateCartCountOutputs(3);
    const out = document.querySelector('output[name="cart-count"]');
    expect(out.textContent).toBe('3');
  });

  it('renderCartTable creates rows for items and update totals', () => {
    const cart = { items: [{ id: 'x', name: 'Item', price: 2.5, quantity: 2 }] };
    renderCartTable(cart);
    const rows = document.querySelectorAll('.cart-table tbody tr');
    expect(rows.length).toBe(1);
    // check line total
    const line = rows[0].querySelector('.line-total');
    expect(line.textContent).toContain('5.00');
  });

  it('updateCartTableTotals calculates subtotal and updates DOM', () => {
    const tbody = document.querySelector('.cart-table tbody');
    tbody.innerHTML = `<tr data-product-id="p"><td></td><td><span class="unit-price" data-price="4.00">AUD $4.00</span></td><td><input type="number" value="2"/></td><td><span class="line-total"></span></td></tr>`;
    const subtotal = updateCartTableTotals();
    expect(subtotal).toBe(8);
    const subEl = document.getElementById('summary-subtotal');
    expect(subEl.dataset.subtotal).toBe('8.00');
  });

  it('updateCartTableTotalsWithShipping respects subtotal parameter', () => {
    const totalEl = document.getElementById('summary-total');
    updateCartTableTotalsWithShipping(5, 10);
    expect(totalEl.textContent).toContain('15.00');
  });

  it('displayShippingEstimate returns calculated result for weight', async () => {
    const res = await displayShippingEstimate('6000', 'pouch', { totalWeight: 300 });
    // our mock returns {totalRate: 6}
    expect(res).toBeTruthy();
    const el = document.getElementById('summary-shipping');
    expect(el.textContent).toContain('AUD $6.00');
  });
});
