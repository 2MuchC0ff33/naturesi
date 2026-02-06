// Module entrypoint: only register service worker for offline/PWA support
import { registerServiceWorker } from './modules/sw-register.js';
import { initCart } from './modules/cart-init.js';
// Worker registry exposes feature-detection helpers and factories for Workers/SharedWorkers
import './modules/worker-registry.js';
// Ensure canonical pricing index and UI guards are available globally (side-effect modules)
import './modules/pricing-index.js';
import './modules/products-guard.js';
// Load these utility modules as side-effects via app entrypoint instead of per-page <script> tags
import './modules/structured-data-fix.js';
import './modules/search-bootstrap.js';
import './modules/search-autocomplete.js';
// Categories nav (populates header categories row)
import './modules/categories-nav.js';
import './modules/structured-data.js';

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
      // Ensure legacy global CartStore is available for modules that expect it
      async function ensureGlobalCartStore() {
        if (typeof window !== 'undefined' && window.CartStore) return;
        await new Promise((resolve) => {
          try {
            const s = document.createElement('script');
            s.src = '/assets/js/cartStore.js';
            s.onload = () => resolve();
            s.onerror = () => resolve();
            document.head.appendChild(s);
          } catch (e) {
            // ignore and continue
            resolve();
          }
        });
      }

      await ensureGlobalCartStore();
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
        await import('./modules/analytics.js');
        // module auto-initialises itself; nothing to do here
      } catch (err) {
        console.warn('Analytics module init failed', err);
      }

      // Shipping estimate page helper: wire postcode lookup to parcel rate calculator
      try {
        if (document.getElementById('postcode') || document.querySelector('.postcode-lookup')) {
          const ship = await import('./modules/cartStore.js');
          const form = document.querySelector('.postcode-lookup');
          const outputId = 'postcode-lookup-result';
          function ensureOutput(){
            let out = document.getElementById(outputId);
            if (!out) {
              out = document.createElement('div');
              out.id = outputId;
              out.className = 'postcode-lookup-result';
              if (form && form.parentNode) form.parentNode.insertBefore(out, form.nextSibling);
            }
            return out;
          }
          if (form) {
            form.addEventListener('submit', async (ev) => {
              ev.preventDefault();
              const pc = (form.querySelector('input[name="postcode"]') || document.getElementById('postcode')).value || '';
              const types = ['pouch','satchel','handbag','shoebox','briefcase'];
              const out = ensureOutput();
              out.innerHTML = 'Looking up...';
              try {
                const rows = await Promise.all(types.map(async (t) => {
                  const r = await ship.calculateParcelRate(t, pc, { storePostcode: '6147', storeState: 'WA' });
                  return { type: t, zone: r.zone, rate: r.rate || r.baseRate || r.totalRate };
                }));
                out.innerHTML = '<ul>' + rows.map(r=>`<li>${r.type}: ${r.rate==null? 'N/A' : 'AUD $' + Number(r.rate).toFixed(2)} (${r.zone})</li>`).join('') + '</ul>';
              } catch (err) {
                out.textContent = 'Lookup failed';
              }
            });
          }
        }
      }
      catch (err) {
        console.warn('Shipping estimate helper failed to initialise', err);
      }
    } catch (err) {
      console.error('Deferred module load failed', err);
    }
  })();
}
