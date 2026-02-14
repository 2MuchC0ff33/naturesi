// Module entrypoint: only register service worker for offline/PWA support
import { initCart } from './modules/cart-init.js';
import './modules/categories-nav.js';
import './modules/pricing-index.js';
import './modules/products-guard.js';
import './modules/search-autocomplete.js';
import './modules/search-bootstrap.js';
import { registerServiceWorker } from './modules/sw-register.js';
import './modules/worker-registry.js';

if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  registerServiceWorker();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      document.documentElement.classList.remove('no-js');
    } catch (_e) {
      /* ignore in non-browser contexts */
    }

    // Video autoplay and looping with pause
    const video = document.querySelector('video');
    const toggleButton = document.getElementById('toggle-autoplay');
    let autoplayEnabled = true;
    const pauseDuration = 2000; // 2 seconds pause before restart

    if (video) {
      // Handle looping with pause
      video.addEventListener('ended', () => {
        if (autoplayEnabled) {
          setTimeout(() => {
            video.play().catch((error) => {
              console.warn('Autoplay blocked or failed:', error);
              // Fallback: Show controls or poster
            });
          }, pauseDuration);
        }
      });

      // Attempt autoplay on load (muted is required)
      video.play().catch((error) => {
        console.warn('Initial autoplay blocked:', error);
        // Video will show poster and controls
      });

      // Toggle button for user control
      if (toggleButton) {
        toggleButton.addEventListener('click', () => {
          autoplayEnabled = !autoplayEnabled;
          toggleButton.textContent = autoplayEnabled ? 'Disable Autoplay' : 'Enable Autoplay';
          toggleButton.setAttribute('aria-label', autoplayEnabled ? 'Disable video autoplay' : 'Enable video autoplay');
          if (!autoplayEnabled) {
            video.pause();
          }
        });
      }
    }
  });

  (async function start() {
    try {
      async function ensureGlobalCartStore() {
        if (typeof window !== 'undefined' && window.CartStore) return;
        await new Promise((resolve) => {
          try {
            const s = document.createElement('script');
            s.src = '/assets/js/cartStore.js';
            s.onload = () => resolve();
            s.onerror = () => resolve();
            document.head.appendChild(s);
          } catch (_e) {
            resolve();
          }
        });
      }

      await ensureGlobalCartStore();
      const store = await initCart();
      window.NaturesCart = { store };
    } catch (_e) {
    }
  })();

  (async () => {
    try {
      if (document.getElementById('confirm-cart-form')) {
        await import('./modules/cart.js');
      };
      if (document.getElementById('paypal-form') || document.getElementById('summary-content')) {
        await import('./modules/checkout.js');
      };

      const path = (location?.pathname) || '';
      try {
        if (path.endsWith('/pages/payment/success.html')) {
          const m = await import('./modules/payment-return.js');
          if (m && typeof m.initPaymentReturn === 'function') m.initPaymentReturn();
        };
        if (path.endsWith('/pages/payment/fail.html')) {
          const m2 = await import('./modules/payment-cancel.js');
          if (m2 && typeof m2.initPaymentCancel === 'function') m2.initPaymentCancel();
        };
      } catch (err) {
        console.error('Payment module init failed', err);
      };

      try {
        const navMod = await import('./modules/nav-toggle.js');
        if (navMod && typeof navMod.init === 'function') navMod.init(document);
      } catch (err) {
        console.warn('Nav toggle init failed', err);
      };

      try {
        const modalMod = await import('./modules/modal.js');
        if (modalMod && typeof modalMod.init === 'function') modalMod.init(document);
      } catch (err) {
        console.warn('Modal init failed', err);
      };

      try {
        if (document.querySelector('figure.product-gallery')) {
          const ph = await import('./modules/product-helpers.js');
          if (ph && typeof ph.init === 'function') ph.init(document);
        };
      } catch (err) {
        console.warn('Product helpers init failed', err);
      };

      try {
        const fb = await import('./modules/featured-badges.js');
        if (fb && typeof fb.initFeaturedBadges === 'function') fb.initFeaturedBadges(document);
      } catch (err) {
        console.warn('Featured badges init failed', err);
      };

      try {
        await import('./modules/analytics.js');
      } catch (err) {
        console.warn('Analytics module init failed', err);
      };

      try {
        if (document.getElementById('postcode') || document.querySelector('.postcode-lookup')) {
          const ship = await import('./modules/cartStore.js');
          const form = document.querySelector('.postcode-lookup');
          const outputId = 'postcode-lookup-result';
          function ensureOutput() {
            let out = document.getElementById(outputId);
            if (!out) {
              out = document.createElement('div');
              out.id = outputId;
              out.className = 'postcode-lookup-result';
              if (form?.parentNode) form.parentNode.insertBefore(out, form.nextSibling);
            }
            return out;
          }
          if (form) {
            form.addEventListener('submit', async (ev) => {
              ev.preventDefault();
              const pc = (form.querySelector('input[name="postcode"]') || document.getElementById('postcode')).value || '';
              const types = ['pouch', 'satchel', 'handbag', 'shoebox', 'briefcase'];
              const out = ensureOutput();
              out.innerHTML = 'Looking up...';
              try {
                const rows = await Promise.all(types.map(async (t) => {
                  const r = await ship.calculateParcelRate(t, pc, { storePostcode: '6147', storeState: 'WA' });
                  return { type: t, zone: r.zone, rate: r.rate || r.baseRate || r.totalRate };
                }));
                out.innerHTML = `<ul>${rows.map(r => `<li>${r.type}: ${r.rate == null ? 'N/A' : `AUD $${Number(r.rate).toFixed(2)}`} (${r.zone})</li>`).join('')}</ul>`;
              } catch (_err) {
                out.textContent = 'Lookup failed';
              }
            });
          };
        };
      } catch (err) {
        console.warn('Shipping estimate helper failed to initialise', err);
      };
    } catch (err) {
      console.error('Deferred module load failed', err);
    }
  })();
};
