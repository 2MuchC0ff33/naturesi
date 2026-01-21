import { describe, it, expect } from 'vitest';
import {
  parseCartRaw,
  computeGrandTotal,
  computeItemLabel,
  buildPayPalPayload,
  renderSummaryToString,
} from '../../assets/js/modules/checkout.js';

describe('checkout helpers', () => {
  it('parseCartRaw handles strings and malformed JSON', () => {
    expect(parseCartRaw('[{"id":"a","title":"A","price":5,"qty":2}]')).toHaveLength(1);
    expect(parseCartRaw('not json')).toBeNull();
    expect(parseCartRaw([])).toEqual([]);
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

  it('buildPayPalPayload returns errors for missing config', () => {
    const { payload, errors } = buildPayPalPayload(null, [
      { id: 'x', title: 'X', price: 1, qty: 1 },
    ]);
    expect(errors).toContain('missing_config');
    const cfg = { env: 'sandbox', business: 'sandbox@example.com', sandbox_url: 'https://s' };
    const result = buildPayPalPayload(cfg, [{ id: 'x', title: 'X', price: 1, qty: 2 }]);
    expect(result.errors).toEqual([]);
    expect(result.payload.amount).toBe('2.00');
  });

  it('renderSummaryToString returns empty message for empty cart', () => {
    const { html, total } = renderSummaryToString([]);
    expect(total).toBe(0);
    expect(html).toContain('Your cart is empty');
  });
});
