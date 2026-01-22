import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasPayPalReturnParams,
  handlePaymentReturn,
  initPaymentReturn,
} from '../../assets/js/modules/payment-return.js';

describe('payment-return module', () => {
  beforeEach(() => {
    // Ensure a clean DOM and storage
    document.body.innerHTML = '<main class="container"></main>';
    localStorage.removeItem('naturesi_cart');
    localStorage.removeItem('naturesi-cart');
  });

  it('detects return params', () => {
    expect(hasPayPalReturnParams('?PayerID=1')).toBe(true);
    expect(hasPayPalReturnParams('?tx=abc')).toBe(true);
    expect(hasPayPalReturnParams('?')).toBe(false);
  });

  it('handlePaymentReturn clears storage and appends note', () => {
    localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([{ id: 'x', title: 'x', price: 1, qty: 1 }])
    );
    const ok = handlePaymentReturn('?PayerID=1');
    expect(ok).toBe(true);
    expect(localStorage.getItem('naturesi_cart')).toBeNull();
    expect(localStorage.getItem('naturesi-cart')).toBeNull();
    expect(document.getElementById('cart-cleared-note')).not.toBeNull();
  });

  it('initPaymentReturn runs on actual location.search', () => {
    // Simulate a location search by passing to handlePaymentReturn directly
    // But also test initPaymentReturn is safe when no params
    initPaymentReturn();
  });
});
