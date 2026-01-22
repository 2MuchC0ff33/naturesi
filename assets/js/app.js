// Module entrypoint: only register service worker for offline/PWA support
import { registerServiceWorker } from './modules/sw-register.js';
import { initCart } from './modules/cart-init.js';

if (
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator
) {
  registerServiceWorker();
}

// Defer browser-only startup work behind a document guard so tests can import this module
if (typeof document !== 'undefined') {
  (async function start() {
    try {
      const store = await initCart();
      // expose small debug API
      window.NaturesCart = { store };
    } catch (e) {
      // ignore during test imports
    }
  })();

  (async function () {
    try {
      if (document.getElementById('confirm-cart-form')) {
        await import('./modules/cart.js');
      }
      if (document.getElementById('paypal-form') || document.getElementById('summary-content')) {
        await import('./modules/checkout.js');
      }

      // Initialize PayPal business/env config (overrides form business inputs when configured)
      try {
        await import('./modules/paypal-init.js');
      } catch (err) {
        // ignore if config module isn't available
      }

      // Initialize payment page handlers (moved from inline scripts to modules)
      const path = (location && location.pathname) || '';
      try {
        if (path.endsWith('/pages/payment/success.html')) {
          const m = await import('./modules/payment-return.js');
          if (m && typeof m.initPaymentReturn === 'function') m.initPaymentReturn();
        }
        if (path.endsWith('/pages/payment/fail.html')) {
          const m2 = await import('./modules/payment-cancel.js');
          if (m2 && typeof m2.initPaymentCancel === 'function') m2.initPaymentCancel();
        }
      } catch (err) {
        console.error('Payment module init failed', err);
      }
    } catch (err) {
      console.error('Deferred module load failed', err);
    }
  })();

  (function attachNonInlineHandlers() {
    const select = document.getElementById('site-category-select');
    if (!select) return;
    select.addEventListener('change', () => {
      const map = {
        'wellness-blends': '/pages/store/wellness-blends.html',
        'herbal-infusions': '/pages/store/herbal-infusions.html',
        'black-tea': '/pages/store/black-tea.html',
        'green-tea': '/pages/store/green-tea.html',
        balms: '/pages/store/balms.html',
        creams: '/pages/store/creams.html',
        selfcare: '/pages/store/selfcare.html',
        accessories: '/pages/store/accessories.html',
        'ice-tea': '/pages/store/ice-tea.html',
        'artisan-blends': '/pages/store/artisan-blends.html',
        '': '/pages/store.html',
      };
      window.location.href = map[select.value] || '/pages/store.html';
    });
  })();
}
