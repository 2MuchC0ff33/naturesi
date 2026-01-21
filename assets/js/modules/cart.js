// javascript
// Minimal: normalize cart and write canonical JSON to localStorage on confirm-submit.
(function () {
  const form = document.getElementById('confirm-cart-form');
  if (!form) return;

  const toNumber = (v, fallback = 0) => {
    const n = Number(String(v ?? '').trim());
    return Number.isFinite(n) ? n : fallback;
  };

  const normalizeItem = (s) => {
    const id = String(s.id ?? s.sku ?? '').trim();
    const title = String(s.title ?? s.name ?? '').trim();
    const price = toNumber(s.price, 0);
    const qty = Math.max(0, Math.trunc(toNumber(s.qty, 0)));
    if (!id || !title || qty <= 0) return undefined;
    return { id, title, price: Number(price), qty };
  };

  const readFromDOM = () => {
    const nodes = document.querySelectorAll('.cart-item');
    if (!nodes.length) return null;
    return Array.from(nodes).map((node) => {
      const id = node.getAttribute('data-id') || '';
      const title = node.querySelector('.item-title')?.textContent?.trim() || '';
      const price = node.querySelector('.item-price')?.textContent?.replace(/[^\d.-]/g, '') || node.getAttribute('data-price') || '0';
      const qtyEl = node.querySelector('input[name*="qty"]') || node.querySelector('.item-qty');
      const qty = qtyEl ? (qtyEl.value ?? qtyEl.textContent) : node.getAttribute('data-qty') || '0';
      return { id, title, price, qty };
    });
  };

  const readFromGlobal = () => {
    if (Array.isArray(window.naturesi_cart)) return window.naturesi_cart;
    if (Array.isArray(window.__SAMPLE_CART__)) return window.__SAMPLE_CART__;
    return null;
  };

  const collect = () => {
    const src = readFromGlobal() || readFromDOM() || [];
    const out = [];
    for (const s of src) {
      const it = normalizeItem(s);
      if (it) out.push(it);
    }
    return out;
  };

  form.addEventListener('submit', () => {
    try {
      const cart = collect();
      localStorage.setItem('naturesi_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Save cart failed', err);
    }
  });
})();
