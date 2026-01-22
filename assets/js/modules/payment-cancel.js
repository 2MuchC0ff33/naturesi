export function hasPayPalReturnParams(searchString) {
  try {
    const params = new URLSearchParams(
      searchString || (typeof location !== 'undefined' ? location.search : '')
    );
    return ['PayerID', 'tx', 'paymentId', 'token'].some((k) => params.has(k));
  } catch (e) {
    return false;
  }
}

export function handlePaymentCancel(searchString) {
  if (!hasPayPalReturnParams(searchString)) return false;
  try {
    // Do not clear cart; inform the user and emit an event
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
