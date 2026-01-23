import { describe, it, expect, beforeEach } from 'vitest';
import {
  toNumber,
  normalizeItem,
  readFromDOM,
  readFromGlobal,
  collect,
  saveCart,
  attachFormHandler,
} from '../../assets/js/modules/cart.js';

// Mock HTMLFormElement.prototype.requestSubmit directly in the test file
import { vi } from 'vitest';

beforeAll(() => {
  HTMLFormElement.prototype.requestSubmit = vi.fn(function () {
    if (this.tagName === 'FORM') {
      this.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });
});

describe('cart module helpers', () => {
  beforeEach(() => {
    // reset DOM
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('toNumber parses numbers or returns fallback', () => {
    expect(toNumber(' 12.5 ')).toBe(12.5);
    expect(toNumber('not a number', 7)).toBe(7);
    expect(toNumber(null, 3)).toBe(3);
  });

  it('normalizeItem returns undefined for missing id/title or qty<=0', () => {
    expect(normalizeItem({})).toBeUndefined();
    expect(normalizeItem({ id: 'x', title: 'Y', price: '1', qty: 0 })).toBeUndefined();
    expect(normalizeItem({ id: 'x', name: 'Y', price: '1', qty: '2' })).toMatchObject({
      id: 'x',
      title: 'Y',
      qty: 2,
    });
  });

  it('readFromDOM reads table rows and legacy nodes', () => {
    const table = document.createElement('table');
    table.className = 'cart-table';
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', 'p1');
    tr.innerHTML = `<td><figure><strong>Chamomile</strong></figure></td><td><span class="unit-price" data-price="4.50">AUD $4.50</span></td><td><input type="number" value="2" /></td>`;
    tbody.appendChild(tr);
    table.appendChild(tbody);
    document.body.appendChild(table);

    const out = readFromDOM(document);
    expect(Array.isArray(out)).toBe(true);
    expect(out[0].id).toBe('p1');
  });

  it('readFromGlobal reads global sample cart arrays and legacy objects', () => {
    const g1 = { naturesi_cart: [{ id: 'p1', title: 'T', price: 1, qty: 1 }] };
    expect(readFromGlobal(g1)).toHaveLength(1);
    const g2 = { naturesi_cart: { items: [{ id: 'p2', title: 'T2', price: 2, qty: 1 }] } };
    expect(readFromGlobal(g2)).toHaveLength(1);
  });

  it('collect normalizes mixed sources to normalized items', () => {
    const g = { __SAMPLE_CART__: [{ id: 'p1', title: 'C', price: '2.5', qty: 2 }] };
    const items = collect({ documentRoot: null, globalObj: g });
    expect(items[0]).toMatchObject({ id: 'p1', title: 'C', qty: 2 });
  });

  it('saveCart stores normalized items in provided storage', () => {
    const res = saveCart([{ id: 'p1', title: 'C', price: 1, qty: 2 }], {
      storage: localStorage,
      key: 'test',
    });
    expect(res).toBe(true);
    expect(JSON.parse(localStorage.getItem('test') || '[]')[0].id).toBe('p1');
  });

  it('attachFormHandler persists cart on proceed click', async () => {
    // create a confirm form and a proceed button
    document.body.innerHTML = `<form id="confirm-cart-form"></form><button id="btn-proceed-checkout"></button>`;
    // create product items that collect() will use; set global sample cart
    globalThis.__SAMPLE_CART__ = [{ id: 'p1', title: 'Item', price: 1, qty: 1 }];

    // attach handler and simulate click
    attachFormHandler({ documentRoot: document, storage: localStorage, key: 'naturesi_cart' });
    const btn = document.getElementById('btn-proceed-checkout');
    btn.click();

    // allow microtask queue
    await new Promise((r) => setTimeout(r, 10));
    const stored = JSON.parse(localStorage.getItem('naturesi_cart') || 'null');
    expect(Array.isArray(stored)).toBe(true);
    expect(stored[0].id).toBe('p1');
  });
});
