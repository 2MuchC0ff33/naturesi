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

  it('converts relative return/cancel to absolute using location.origin when available', () => {
    // Temporarily define a location origin for the test
    const oldLoc = globalThis.location;
    try {
      Object.defineProperty(globalThis, 'location', {
        value: { origin: 'https://example.com' },
        configurable: true,
      });
      const cfg = {
        env: 'sandbox',
        business: 'sandbox@example.com',
        sandbox_url: 'https://s',
        return_path: '/pages/payment/success.html',
        cancel_path: '/pages/payment/fail.html',
      };
      const { payload, errors } = buildPayPalPayload(cfg, [
        { id: 'x', title: 'X', price: 1, qty: 1 },
      ]);
      expect(errors).toEqual([]);
      expect(payload.return).toBe('https://example.com/pages/payment/success.html');
      expect(payload.cancel_return).toBe('https://example.com/pages/payment/fail.html');

      // Absolute URLs stay absolute
      const cfg2 = Object.assign({}, cfg, { return_path: 'https://my.site/ok' });
      const r2 = buildPayPalPayload(cfg2, [{ id: 'x', title: 'X', price: 1, qty: 1 }]);
      expect(r2.payload.return).toBe('https://my.site/ok');
    } finally {
      // Restore original location
      Object.defineProperty(globalThis, 'location', { value: oldLoc, configurable: true });
    }
  });

  it('renderSummaryToString returns empty message for empty cart', () => {
    const { html, total } = renderSummaryToString([]);
    expect(total).toBe(0);
    expect(html).toContain('Your cart is empty');
  });

  it('buildPayPalPayload includes shipping when provided', () => {
    const cfg = { env: 'sandbox', business: 'sandbox@example.com', sandbox_url: 'https://s' };
    const result = buildPayPalPayload(cfg, [{ id: 'x', title: 'X', price: 1, qty: 2 }], 1.5);
    expect(result.errors).toEqual([]);
    expect(result.payload.amount).toBe('3.50'); // 2.00 + 1.50 shipping
  });
});
