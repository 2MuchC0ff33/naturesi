import { escapeHtml } from './html.js';

export function hasPayPalReturnParams(searchString) {
  try {
    const params = new URLSearchParams(
      searchString || (typeof location !== 'undefined' ? location.search : '')
    );
    return ['PayerID', 'tx', 'paymentId', 'token', 'orderId'].some((k) => params.has(k));
  } catch (e) {
    return false;
  }
}

export function getLastOrder() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('naturesi_last_order');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearLastOrder() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('naturesi_last_order');
    }
  } catch (_) {}
}

export function handlePaymentCancel(searchString) {
  if (!hasPayPalReturnParams(searchString)) return false;
  try {
    if (typeof document !== 'undefined') {
      const params = new URLSearchParams(searchString || location.search);
      const detail = Object.fromEntries([...params.entries()]);
      window.dispatchEvent &&
        window.dispatchEvent(new CustomEvent('cart:payment-cancelled', { detail }));

      if (!document.getElementById('cart-cancelled-note')) {
        const main = document.querySelector('main.container') || document.body;
        const note = document.createElement('p');
        note.id = 'cart-cancelled-note';
        note.className = 'muted';
        note.setAttribute('role', 'status');
        note.setAttribute('aria-live', 'polite');
        note.textContent = 'Your payment was not completed; your cart has been left intact.';
        main.appendChild(note);
      }
    }
    return true;
  } catch (err) {
    console.error('handlePaymentCancel error', err);
    return false;
  }
}

export function initPaymentCancel() {
  try {
    if (typeof document === 'undefined') return;
    if (hasPayPalReturnParams()) handlePaymentCancel();
  } catch (e) {
    console.error('initPaymentCancel failed', e);
  }
}

export function handlePaymentReturn(searchString) {
  if (!hasPayPalReturnParams(searchString)) return false;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('naturesi_cart');
    }
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('cart:cleared:payment'));

      const order = getLastOrder();
      if (order && !document.getElementById('order-confirmation')) {
        const main = document.querySelector('main.container') || document.body;
        const confirm = document.createElement('section');
        confirm.id = 'order-confirmation';
        confirm.setAttribute('aria-labelledby', 'order-confirmation-heading');
        confirm.innerHTML =
          '<h2 id="order-confirmation-heading">Order confirmed</h2>' +
          '<p>Thank you for your order! Your order ID is:</p>' +
          '<p class="order-id-display"><strong>' +
          escapeHtml(order.orderId || '') +
          '</strong></p>' +
          '<p class="muted">Please save this order ID for your records. ' +
          'You will receive a confirmation email once payment is captured.</p>';
        const existingH1 = main.querySelector('h1');
        if (existingH1 && existingH1.nextSibling) {
          main.insertBefore(confirm, existingH1.nextSibling);
        } else {
          main.appendChild(confirm);
        }
        clearLastOrder();
      }

      if (!document.getElementById('cart-cleared-note')) {
        const main = document.querySelector('main.container') || document.body;
        const note = document.createElement('p');
        note.id = 'cart-cleared-note';
        note.className = 'muted';
        note.setAttribute('role', 'status');
        note.setAttribute('aria-live', 'polite');
        note.textContent = 'Your cart has been cleared.';
        main.appendChild(note);
      }
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
