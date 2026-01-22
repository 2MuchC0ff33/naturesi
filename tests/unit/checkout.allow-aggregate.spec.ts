import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runCheckout } from '../../assets/js/modules/checkout.js';

describe('runCheckout (aggregate)', () => {
  beforeEach(() => {
    // Reset DOM and localStorage
    document.body.innerHTML = '';
    const container = document.createElement('div');
    container.innerHTML = `
      <div id="summary-content"></div>
      <section id="payment"></section>
      <p id="checkout-note" class="muted"></p>
      <p id="checkout-error" class="error hidden" role="alert"></p>
    `;
    document.body.appendChild(container);
    globalThis.localStorage.clear();
  });

  it('creates and populates PayPal aggregated form when allow_aggregate is true', async () => {
    // Put a multi-item cart
    localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([
        { id: 'sku-a', title: 'A', price: 3.5, qty: 1 },
        { id: 'sku-b', title: 'B', price: 2.5, qty: 1 },
      ])
    );

    // Stub fetch to return a config that enables aggregate
    const cfg = {
      env: 'sandbox',
      business: 'test@example.com',
      sandbox_url: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
      currency: 'AUD',
      return_path: '/pages/payment/success.html',
      cancel_path: '/pages/payment/fail.html',
      allow_aggregate: true,
    };

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => cfg })));

    await runCheckout({ fetchPath: '/assets/js/data/paypal.json' });

    // Form should be created and inputs populated
    const form = document.getElementById('paypal-form');
    expect(form).not.toBeNull();

    const amount = (document.getElementById('pp-amount') as HTMLInputElement).value;
    const business = (document.getElementById('pp-business') as HTMLInputElement).value;

    expect(Number(amount)).toBeCloseTo(6.0, 2);
    expect(business).toBe('test@example.com');
  });

  it('does not create aggregated form when allow_aggregate is false', async () => {
    localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([{ id: 'sku-a', title: 'A', price: 3.5, qty: 1 }])
    );

    const cfg = {
      env: 'sandbox',
      business: 'test@example.com',
      sandbox_url: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
      currency: 'AUD',
      allow_aggregate: false,
    };

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => cfg })));

    await runCheckout({ fetchPath: '/assets/js/data/paypal.json' });

    const form = document.getElementById('paypal-form');
    expect(form).toBeNull();

    // deprecation message should be present in note
    const note = document.getElementById('checkout-note');
    expect(note?.textContent || '').toContain('Aggregate checkout');
  });
});
