// Module entrypoint: only register service worker for offline/PWA support
import { registerServiceWorker } from './modules/sw-register.js';
import { initCart } from './modules/cart-init.js';
// Worker registry exposes feature-detection helpers and factories for Workers/SharedWorkers
import './modules/worker-registry.js';

if (
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator
) {
  registerServiceWorker();
}

// Defer browser-only startup work behind a document guard so tests can import this module
if (typeof document !== 'undefined') {
  // Remove the `no-js` HTML class early so CSS can apply JS-enabled styles
  // while still allowing HTML-only users to retain visible navigation.
  try {
    document.documentElement.classList.remove('no-js');
  } catch (e) {
    /* ignore in non-browser contexts */
  }

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

      // Initialize category select behavior only when present (keeps no-JS and HTML-first fallback intact)
      try {
        if (document.getElementById('site-category-select')) {
          const m = await import('./modules/category-select.js');
          if (m && typeof m.initCategorySelect === 'function') m.initCategorySelect(document);
        }
        // Initialize mobile nav toggle (inserts an accessible hamburger button if needed)
        try {
          const navMod = await import('./modules/nav-toggle.js');
          if (navMod && typeof navMod.init === 'function') navMod.init(document);
        } catch (err) {
          console.warn('Nav toggle init failed', err);
        }

        // Initialize accessible modal behavior (lightweight, optional)
        try {
          const modalMod = await import('./modules/modal.js');
          if (modalMod && typeof modalMod.init === 'function') modalMod.init(document);
        } catch (err) {
          console.warn('Modal init failed', err);
        }

        // Enhance product gallery markup with Utilities to reduce CLS and ensure consistent object-fit
        try {
          if (document.querySelector('figure.product-gallery')) {
            const ph = await import('./modules/product-helpers.js');
            if (ph && typeof ph.init === 'function') ph.init(document);
          }
        } catch (err) {
          console.warn('Product helpers init failed', err);
        }

        // Initialize featured badges module to insert badges for data-featured products
        try {
          const fb = await import('./modules/featured-badges.js');
          if (fb && typeof fb.initFeaturedBadges === 'function') fb.initFeaturedBadges(document);
        } catch (err) {
          console.warn('Featured badges init failed', err);
        }

        // Initialize lightweight analytics (uses a dedicated worker under the hood)
        try {
          const analyticsMod = await import('./modules/analytics.js');
          // module auto-initialises itself; nothing to do here
        } catch (err) {
          console.warn('Analytics module init failed', err);
        }
      } catch (err) {
        console.error('Category select init failed', err);
      }
    } catch (err) {
      console.error('Deferred module load failed', err);
    }
  })();
}
