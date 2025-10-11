import { CartStore } from './cartStore.js';
import { updateCartCountOutputs, renderCartTable, setProductIndex } from './cartUI.js';
import { requestBackgroundSync } from './sync.js';

// initCart - centralised cart initialiser extracted from app.js
export async function initCart() {
    const cartStore = new CartStore();
    await cartStore.init();

    // load canonical product index (best-effort). We expose it to cart UI so rendering prefers it.
    try {
        const res = await fetch('/assets/js/data/products.json', { cache: 'no-store' });
        if (res && res.ok) {
            const payload = await res.json();
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

            // price extraction
            let price = null;
            const priceField = productEl && (productEl.querySelector('[data-price]') || productEl.querySelector('[itemprop="price"]'));
            if (priceField) price = parseFloat(priceField.dataset.price || priceField.getAttribute('content') || priceField.textContent.replace(/[^0-9\.]/g, '')) || null;

            // image extraction
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

            // sku and description
            const sku = productEl && (productEl.dataset.sku || (productEl.querySelector('[itemprop="sku"]') && productEl.querySelector('[itemprop="sku"]').textContent.trim())) || null;
            const descriptionEl = productEl && (productEl.querySelector('[itemprop="description"]') || productEl.querySelector('.product-description, p'));
            const description = descriptionEl ? descriptionEl.textContent.trim().slice(0, 160) : '';

            await cartStore.add({ id, name, size, quantity, price, image, sku, description });
            const updated = cartStore.get();
            updateCartCountOutputs((updated.items || []).reduce((s, it) => s + (parseInt(it.quantity, 10) || 0), 0));
            renderCartTable(updated);
            // Log the updated cart state for debugging
            console.debug('Cart updated:', updated);
            // best-effort background sync registration
            requestBackgroundSync('sync-cart').catch((err) => {
                console.error('Background sync registration failed:', err);
            });
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
            const c = cartStore.get();
            updateCartCountOutputs((c.items || []).reduce((s, it) => s + (parseInt(it.quantity, 10) || 0), 0));
            renderCartTable(c);
        });

        cartForm.addEventListener('click', async (ev) => {
            if (ev.target && ev.target.matches('.remove-item')) {
                const row = ev.target.closest('tr');
                const id = row && row.dataset.productId;
                if (id) {
                    await cartStore.remove(id);
                    const c2 = cartStore.get();
                    updateCartCountOutputs((c2.items || []).reduce((s, it) => s + (parseInt(it.quantity, 10) || 0), 0));
                    renderCartTable(c2);
                }
            }
        });
    }

    // return the store so callers (app.js) can expose a debug API
    return cartStore;
}
