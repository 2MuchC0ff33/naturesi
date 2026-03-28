import { hasPayPalReturnParams } from './payment-helpers.js';

export function handlePaymentReturn(searchString) {
  if (!hasPayPalReturnParams(searchString)) return false;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('naturesi_cart');
    }
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('cart:cleared:payment'));
      const main = document.querySelector('main.container') || document.body;
      const note = document.createElement('p');
      note.id = 'cart-cleared-note';
      note.className = 'muted';
      note.setAttribute('role', 'status');
      note.setAttribute('aria-live', 'polite');
      note.textContent = 'Your cart has been cleared.';
      main.appendChild(note);
    }
    return true;
  } catch (err) {
    console.error('handlePaymentReturn error', err);
    return false;
  }
}

export function initPaymentReturn() {
  try {
    if (typeof document === 'undefined') return;
    if (hasPayPalReturnParams()) handlePaymentReturn();
  } catch (e) {
    console.error('initPaymentReturn failed', e);
  }
}
