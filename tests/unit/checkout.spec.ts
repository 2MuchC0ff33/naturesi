import { describe, it, expect } from 'vitest';
import {
  parseCartRaw,
  computeGrandTotal,
  computeItemLabel,
  renderSummaryToString,
} from '../../assets/js/modules/checkout.js';

describe('checkout helpers', () => {
  it('parseCartRaw handles strings and malformed JSON', () => {
    expect(parseCartRaw('[{"id":"a","title":"A","price":5,"qty":2}]')).toEqual({
      cart: [{ id: 'a', title: 'A', price: 5, qty: 2 }],
      shipping: 0,
    });
    expect(parseCartRaw('not json')).toEqual({ cart: [], shipping: 0 });
    expect(parseCartRaw([])).toEqual({ cart: [], shipping: 0 });
  });

  it('computeGrandTotal sums correctly', () => {
    const cart = [
      { price: 2.5, qty: 2 },
      { price: 1, qty: 1 },
    ];
    expect(computeGrandTotal(cart)).toBe(6);
  });

  it('computeItemLabel truncates long labels to 127 chars', () => {
    const cart = [{ title: 'x'.repeat(200), qty: 1 }];
    const lbl = computeItemLabel(cart);
    expect(lbl.length).toBeLessThanOrEqual(127);
  });

  it('renderSummaryToString returns empty message for empty cart', () => {
    const { html, total } = renderSummaryToString([]);
    expect(total).toBe(0);
    expect(html).toContain('Your cart is empty');
  });
});
