// Module: payment-success
// Purpose: Clear transient cart keys on payment success page.
// Conservative, safe: only removes known cart keys and catches errors.
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('naturesi_cart');
    localStorage.removeItem('naturesi-cart');
  }
} catch (e) {
  // Non-fatal: log for diagnostics
  console && console.warn && console.warn('Failed to clear cart on payment success:', e);
}
