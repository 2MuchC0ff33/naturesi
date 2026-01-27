// Minimal cart helpers (exported) — pure helpers + guarded browser runner
export const toNumber = (v, fallback = 0) => {
  const s = String(v ?? '').trim();
  if (s === '') return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
};

export const normalizeItem = (s) => {
  const id = String(s.id ?? s.sku ?? '').trim();
  const title = String(s.title ?? s.name ?? '').trim();
  const price = toNumber(s.price, 0);
  const qty = Math.max(0, Math.trunc(toNumber(s.qty, 0)));
  if (!id || !title || qty <= 0) return undefined;
  return { id, title, price: Number(price), qty };
};

export function readFromDOM(documentRoot = typeof document !== 'undefined' ? document : null) {
  if (!documentRoot) return null;

  // Prefer structured cart table rows when present
  const rows = documentRoot.querySelectorAll('.cart-table tbody tr');
  if (rows && rows.length) {
    return Array.from(rows).map((row) => {
      const id = row.dataset.productId || row.getAttribute('data-id') || '';
      const title =
        row.querySelector('figure strong')?.textContent?.trim() ||
        row.querySelector('.item-title')?.textContent?.trim() ||
        '';
      const priceRaw =
        row.querySelector('.unit-price')?.dataset?.price ||
        row.querySelector('.unit-price')?.textContent ||
        row.querySelector('[data-price]')?.getAttribute('data-price') ||
        row.getAttribute('data-price') ||
        '0';
      const price = String(priceRaw).replace(/[^\d.-]/g, '') || '0';
      const qtyEl =
        row.querySelector('input[type="number"]') ||
        row.querySelector('input[name*="qty"]') ||
        row.querySelector('.item-qty');
      const qty = qtyEl ? (qtyEl.value ?? qtyEl.textContent) : row.getAttribute('data-qty') || '0';
      return { id, title, price, qty };
    });
  }

  // Fallback to legacy .cart-item nodes
  const nodes = documentRoot.querySelectorAll('.cart-item');
  if (!nodes.length) return null;
  return Array.from(nodes).map((node) => {
    const id = node.getAttribute('data-id') || '';
    const title = node.querySelector('.item-title')?.textContent?.trim() || '';
    const priceRaw =
      node.querySelector('.item-price')?.textContent || node.getAttribute('data-price') || '0';
    const price = String(priceRaw).replace(/[^\d.-]/g, '') || '0';
    const qtyEl = node.querySelector('input[name*="qty"]') || node.querySelector('.item-qty');
    const qty = qtyEl ? (qtyEl.value ?? qtyEl.textContent) : node.getAttribute('data-qty') || '0';
    return { id, title, price, qty };
  });
}

export function readFromGlobal(globalObj = typeof globalThis !== 'undefined' ? globalThis : {}) {
  if (Array.isArray(globalObj.naturesi_cart)) return globalObj.naturesi_cart;
  // support legacy/object shape: { items: [...] }
  if (globalObj.naturesi_cart && Array.isArray(globalObj.naturesi_cart.items))
    return globalObj.naturesi_cart.items;
  if (Array.isArray(globalObj.__SAMPLE_CART__)) return globalObj.__SAMPLE_CART__;
  if (globalObj.__SAMPLE_CART__ && Array.isArray(globalObj.__SAMPLE_CART__.items))
    return globalObj.__SAMPLE_CART__.items;
  return null;
}

export function collect({
  documentRoot = typeof document !== 'undefined' ? document : null,
  globalObj = typeof globalThis !== 'undefined' ? globalThis : {},
} = {}) {
  const src = readFromGlobal(globalObj) || readFromDOM(documentRoot) || [];
  const out = [];
  for (const s of src) {
    const it = normalizeItem(s);
    if (it) out.push(it);
  }
  return out;
}

export function saveCart(
  cart,
  {
    storage = typeof globalThis !== 'undefined' ? globalThis.localStorage : null,
    key = 'naturesi_cart',
  } = {}
) {
  try {
    if (!storage) return false;
    const srcArr = Array.isArray(cart) ? cart : (cart?.items ?? []);
    const out = (srcArr || []).map(normalizeItem).filter(Boolean);
    storage.setItem(key, JSON.stringify(out));
    return true;
  } catch (e) {
    console.error('Error saving cart', e);
    return false;
  }
}

// Updated attachFormHandler to ensure robust navigation and cart persistence
export function attachFormHandler({
  documentRoot = typeof document !== 'undefined' ? document : null,
  storage = typeof globalThis !== 'undefined' ? globalThis.localStorage : null,
  key = 'naturesi_cart',
} = {}) {
  if (!documentRoot || !documentRoot.getElementById) return;
  const form = documentRoot.getElementById('confirm-cart-form');
  if (!form) return;

  form.addEventListener('submit', (evt) => {
    try {
      const cart = collect({ documentRoot });

      // Extract shipping cost
      const shippingEl = documentRoot.getElementById('summary-shipping');
      let shippingCost = 0;
      if (shippingEl) {
        const shippingText = shippingEl.textContent.trim();
        const match = shippingText.match(/AUD \$(\d+\.\d+)/);
        if (match) shippingCost = parseFloat(match[1]);
      }

      const cartData = { cart, shipping: shippingCost };
      if (storage) storage.setItem(key, JSON.stringify(cartData));
    } catch (err) {
      console.error('Save cart failed', err);
    }
  });

  const btn = documentRoot.getElementById('btn-proceed-checkout');
  if (btn) {
    btn.addEventListener('click', (ev) => {
      try {
        ev.preventDefault();

        // Validate shipping calculation
        const shippingEl = documentRoot.getElementById('summary-shipping');
        if (shippingEl && shippingEl.textContent.trim() === 'Calculated at checkout') {
          // Show error message
          const errorId = 'checkout-error';
          let errorEl = documentRoot.getElementById(errorId);
          if (!errorEl) {
            errorEl = documentRoot.createElement('p');
            errorEl.id = errorId;
            errorEl.className = 'error-message';
            errorEl.setAttribute('role', 'alert');
            errorEl.textContent =
              'Please enter a valid postcode to calculate shipping costs before proceeding to checkout.';
            const container =
              documentRoot.querySelector('.cart-actions-external') || documentRoot.body;
            container.insertBefore(errorEl, container.firstChild);
          }
          return; // Prevent checkout
        }

        // Remove any existing error message
        const existingError = documentRoot.getElementById('checkout-error');
        if (existingError) existingError.remove();

        const cart = collect({ documentRoot });

        // Extract shipping cost
        let shippingCost = 0;
        if (shippingEl) {
          const shippingText = shippingEl.textContent.trim();
          const match = shippingText.match(/AUD \$(\d+\.\d+)/);
          if (match) shippingCost = parseFloat(match[1]);
        }

        const cartData = { cart, shipping: shippingCost };
        if (storage) storage.setItem(key, JSON.stringify(cartData));

        const noticeId = 'checkout-save-note';
        if (!documentRoot.getElementById(noticeId)) {
          const note = documentRoot.createElement('p');
          note.id = noticeId;
          note.className = 'muted';
          note.setAttribute('role', 'status');
          note.setAttribute('aria-live', 'polite');
          note.textContent = 'Preparing checkout… You will be redirected to the next step.';
          const container = documentRoot.querySelector('#main-content') || documentRoot.body;
          container.insertBefore(note, container.firstChild);
        }

        try {
          if (typeof form.requestSubmit === 'function') {
            try {
              form.requestSubmit();
            } catch (err) {
              // jsdom may have requestSubmit stubbed as not-implemented
              if (typeof form.submit === 'function') form.submit();
              else if (globalThis && globalThis.location)
                globalThis.location.assign('/pages/checkout.html');
            }
          } else if (typeof form.submit === 'function') {
            form.submit();
          } else {
            if (globalThis && globalThis.location)
              globalThis.location.assign('/pages/checkout.html');
          }
        } catch (err) {
          // fallback to absolute navigation
          if (globalThis && globalThis.location) globalThis.location.assign('/pages/checkout.html');
        }
      } catch (err) {
        console.error('Proceed click handler failed', err);
        if (globalThis && globalThis.location) globalThis.location.assign('/pages/checkout.html');
      }
    });
  }
}

// Auto-run in browser if present
if (typeof document !== 'undefined') {
  try {
    attachFormHandler();
  } catch (e) {
    // fail silently in non-browser contexts
  }
}
