// Module entrypoint: only register service worker for offline/PWA support
import { registerServiceWorker } from './modules/sw-register.js';
import { initCart } from './modules/cart-init.js';

registerServiceWorker();

(async function start() {
  const store = await initCart();
  // expose small debug API
  window.NaturesCart = { store };
})();

(async function () {
  try {
    if (document.getElementById('confirm-cart-form')) {
      await import('./modules/cart.js');
    }
    if (document.getElementById('paypal-form') || document.getElementById('summary-content')) {
      await import('./modules/checkout.js');
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
