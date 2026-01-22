import { describe, it, expect } from 'vitest';
import { toNumber, normalizeItem, readFromDOM, collect } from '../../assets/js/modules/cart.js';
import { JSDOM } from 'jsdom';

describe('cart helpers', () => {
  it('toNumber converts strings to numbers and falls back', () => {
    expect(toNumber(' 12.34 ')).toBe(12.34);
    expect(toNumber('x', 5)).toBe(5);
    // null should use the provided fallback value
    expect(toNumber(null, 7)).toBe(7);
  });

  it('normalizeItem returns undefined for missing fields and normalizes valid item', () => {
    expect(normalizeItem({})).toBeUndefined();
    const s = { id: 'sku-1', title: 'Tea', price: '9.95', qty: '2' };
    const it = normalizeItem(s);
    expect(it).toEqual({ id: 'sku-1', title: 'Tea', price: 9.95, qty: 2 });
  });

  it('readFromDOM parses DOM nodes into items', () => {
    const html = `<div class="cart-item" data-id="sku-1" data-price="$9.95"><span class="item-title">Chamomile</span><input name="qty" value="3"/></div>`;
    const dom = new JSDOM(html);
    const items = readFromDOM(dom.window.document);
    expect(Array.isArray(items)).toBe(true);
    expect(items[0].id).toBe('sku-1');
    expect(items[0].price).toMatch(/9.95/);
  });

  it('collect normalizes items from global or DOM', () => {
    const sampleGlobal = { naturesi_cart: [{ id: 's', title: 't', price: 4.5, qty: 1 }] };
    expect(collect({ globalObj: sampleGlobal })).toEqual([
      { id: 's', title: 't', price: 4.5, qty: 1 },
    ]);
  });

  it('collect accepts object-shaped global cart with items array', () => {
    const sampleGlobalObj = {
      naturesi_cart: { items: [{ id: 'o', title: 'obj', price: 3, qty: 2 }] },
    };
    expect(collect({ globalObj: sampleGlobalObj })).toEqual([
      { id: 'o', title: 'obj', price: 3, qty: 2 },
    ]);
  });

  it('saveCart writes canonical array to storage when given object or array', () => {
    const calls = {} as any;
    const mockStorage = {
      setItem(k, v) {
        calls.key = k;
        calls.value = v;
      },
    };
    const objShape = { items: [{ id: 'x', title: 'X', price: '4.5', qty: '3' }] };
    const { saveCart } = require('../../assets/js/modules/cart.js');
    // @ts-ignore call
    const ok = saveCart(objShape, { storage: mockStorage, key: 'naturesi_cart' });
    expect(ok).toBe(true);
    expect(calls.key).toBe('naturesi_cart');
    const parsed = JSON.parse(calls.value);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toEqual({ id: 'x', title: 'X', price: 4.5, qty: 3 });
  });
});
