import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasPayPalReturnParams,
  handlePaymentReturn,
} from '../../assets/js/modules/payment-return.js';
import {
  hasPayPalReturnParams as hasCancelParams,
  handlePaymentCancel,
} from '../../assets/js/modules/payment-cancel.js';

describe('payment return/cancel helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main class="container"></main>';
    localStorage.setItem('naturesi_cart', JSON.stringify([{ id: 'x' }]));
  });

  it('hasPayPalReturnParams detects params and handlePaymentReturn clears cart', () => {
    const qs = '?tx=123&PayerID=abc';
    expect(hasPayPalReturnParams(qs)).toBe(true);
    const ok = handlePaymentReturn(qs);
    expect(ok).toBe(true);
    expect(localStorage.getItem('naturesi_cart')).toBeNull();
    expect(document.getElementById('cart-cleared-note')).toBeTruthy();
  });

  it('handlePaymentCancel shows message and does not clear cart', () => {
    const qs = '?token=abc';
    const ok = handlePaymentCancel(qs);
    expect(ok).toBe(true);
    expect(localStorage.getItem('naturesi_cart')).not.toBeNull();
    expect(document.getElementById('cart-cancelled-note')).toBeTruthy();
  });
});
