// Minimal cart helpers (exported) — pure helpers + guarded browser runner
export const toNumber = (v, fallback = 0) => {
  const n = Number(String(v ?? '').trim());
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
  if (Array.isArray(globalObj.__SAMPLE_CART__)) return globalObj.__SAMPLE_CART__;
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
    storage.setItem(key, JSON.stringify(cart));
    return true;
  } catch (e) {
    console.error('Error saving cart', e);
    return false;
  }
}

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
      if (storage) storage.setItem(key, JSON.stringify(cart));
    } catch (err) {
      console.error('Save cart failed', err);
    }
  });
}

// Auto-run in browser if present
if (typeof document !== 'undefined') {
  try {
    attachFormHandler();
  } catch (e) {
    // fail silently in non-browser contexts
  }
}
