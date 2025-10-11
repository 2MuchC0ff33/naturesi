// Module entrypoint: only register service worker for offline/PWA support
import { registerServiceWorker } from './modules/sw-register.js';
import { initCart } from './modules/cart-init.js';

registerServiceWorker();

(async function start() {
    const store = await initCart();
    // expose small debug API
    window.NaturesCart = { store };
})();

