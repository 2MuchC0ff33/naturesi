h45011
s 00011/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
// Module: payment-success
// Purpose: Clear transient cart keys on payment success page.
// Conservative, safe: only removes known cart keys and catches errors.
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('naturesi_cart');
  }
} catch (e) {
  // Non-fatal: log for diagnostics
  console && console.warn && console.warn('Failed to clear cart on payment success:', e);
}
E 1
