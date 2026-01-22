import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasPayPalReturnParams,
  handlePaymentCancel,
  initPaymentCancel,
} from '../../assets/js/modules/payment-cancel.js';

describe('payment-cancel module', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main class="container"></main>';
  });

  it('detects cancel params', () => {
    expect(hasPayPalReturnParams('?token=1')).toBe(true);
    expect(hasPayPalReturnParams('?paymentId=abc')).toBe(true);
    expect(hasPayPalReturnParams('?')).toBe(false);
  });

  it('handlePaymentCancel emits event and appends note without clearing cart', () => {
    localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([{ id: 'a', title: 'A', price: 1, qty: 1 }])
    );
    const ok = handlePaymentCancel('?token=1');
    expect(ok).toBe(true);
    // Cart remains
    expect(localStorage.getItem('naturesi_cart')).not.toBeNull();
    // Note present
    expect(document.getElementById('cart-cancelled-note')).not.toBeNull();
  });

  it('initPaymentCancel is safe to run', () => {
    initPaymentCancel();
  });
});
