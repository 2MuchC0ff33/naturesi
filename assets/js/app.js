// Module entrypoint: only register service worker for offline/PWA support
import { registerServiceWorker } from './modules/sw-register.js';
import { CartStore } from './modules/cartStore.js';
import { updateCartCountOutputs, renderCartTable, updateCartTableTotals, setProductIndex } from './modules/cartUI.js';
import { requestBackgroundSync } from './modules/sync.js';

registerServiceWorker();

// Initialise modular cart
const cartStore = new CartStore();

async function initCart() {
    await cartStore.init();
    // load canonical product index (best-effort). We expose it to cart UI so rendering prefers it.
    try {
        const res = await fetch('/assets/js/data/products.json', { cache: 'no-store' });
        if (res && res.ok) {
            const payload = await res.json();
            // support either { products: [...] } or [ ... ] formats
            const list = Array.isArray(payload) ? payload : (payload.products || []);
            const idx = {};
            list.forEach((p) => { if (p && p.id) idx[p.id] = p; if (p && p.sku) idx[p.sku] = p; });
            setProductIndex(idx);
        }
    } catch (e) {
        // ignore errors; fallback to per-page data attributes
    }
    // initial UI render
    const cart = cartStore.get();
    updateCartCountOutputs((cart.items || []).reduce((s, it) => s + (parseInt(it.quantity, 10) || 0), 0));
    renderCartTable(cart);

    // bind add-to-cart forms
    document.querySelectorAll('form.add-to-cart, form.product-options').forEach((form) => {
        form.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(form);
            const productEl = form.closest('.product') || form.closest('[itemscope]') || form;
            const id = productEl && (productEl.id || productEl.dataset.sku || productEl.dataset.id) ? (productEl.id || productEl.dataset.sku || productEl.dataset.id) : `i_${Math.random().toString(36).slice(2, 9)}`;
            const nameEl = productEl && (productEl.querySelector('[itemprop="name"]') || productEl.querySelector('h3, h2, .product-title'));
            const name = nameEl ? nameEl.textContent.trim() : fd.get('name') || 'Item';
            const size = fd.get('size') || fd.get('package') || '';
            const quantity = parseInt(fd.get('quantity') || fd.get('qty') || 1, 10) || 1;

            // price extraction: check data-price attribute, itemprop, or fall back to text
            let price = null;
            const priceField = productEl && (productEl.querySelector('[data-price]') || productEl.querySelector('[itemprop="price"]'));
            if (priceField) price = parseFloat(priceField.dataset.price || priceField.getAttribute('content') || priceField.textContent.replace(/[^0-9\.]/g, '')) || null;

            // image extraction: prefer data-image, then itemprop image, then first img within product
            let image = null;
            if (productEl) {
                if (productEl.dataset && productEl.dataset.image) image = productEl.dataset.image;
                const imgByItem = productEl.querySelector('img[itemprop="image"]');
                if (!image && imgByItem) image = imgByItem.currentSrc || imgByItem.src || imgByItem.getAttribute('src');
                if (!image) {
                    const firstImg = productEl.querySelector('img');
                    if (firstImg) image = firstImg.currentSrc || firstImg.src || firstImg.getAttribute('src');
                }
            }
            if (image && image.startsWith('./')) image = image.replace('./', '/');

            // sku and description if present
            const sku = productEl && (productEl.dataset.sku || (productEl.querySelector('[itemprop="sku"]') && productEl.querySelector('[itemprop="sku"]').textContent.trim())) || null;
            const descriptionEl = productEl && (productEl.querySelector('[itemprop="description"]') || productEl.querySelector('.product-description, p'));
            const description = descriptionEl ? descriptionEl.textContent.trim().slice(0, 160) : '';

            await cartStore.add({ id, name, size, quantity, price, image, sku, description });
            const cart = cartStore.get();
            updateCartCountOutputs((cart.items || []).reduce((s, it) => s + (parseInt(it.quantity, 10) || 0), 0));
            renderCartTable(cart);
            // best-effort background sync registration
            requestBackgroundSync('sync-cart').catch(() => { });
        });
    });

    // cart page interactions
    const cartForm = document.getElementById('cart-form');
    if (cartForm) {
        cartForm.addEventListener('submit', (ev) => {
            ev.preventDefault();
            cartForm.querySelectorAll('tbody tr').forEach(async (row) => {
                const qty = row.querySelector('input[type="number"]');
                const id = row.dataset.productId;
                if (qty && id) await cartStore.updateQuantity(id, parseInt(qty.value, 10) || 0);
            });
            const cart = cartStore.get();
            updateCartCountOutputs((cart.items || []).reduce((s, it) => s + (parseInt(it.quantity, 10) || 0), 0));
            renderCartTable(cart);
        });

        cartForm.addEventListener('click', async (ev) => {
            if (ev.target && ev.target.matches('.remove-item')) {
                const row = ev.target.closest('tr');
                const id = row && row.dataset.productId;
                if (id) {
                    await cartStore.remove(id);
                    const cart = cartStore.get();
                    updateCartCountOutputs((cart.items || []).reduce((s, it) => s + (parseInt(it.quantity, 10) || 0), 0));
                    renderCartTable(cart);
                }
            }
        });
    }
}

initCart().catch(() => { });

// Expose a tiny API for debugging and progressive enhancement
window.NaturesCart = {
    getCart: () => cartStore.get(),
    add: (item) => cartStore.add(item),
    remove: (id) => cartStore.remove(id),
    updateQuantity: (id, qty) => cartStore.updateQuantity(id, qty)
};

