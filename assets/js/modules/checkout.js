// Checkout helpers exported for testing + guarded browser runner
export function parseCartRaw(raw) {
  try {
    if (!raw) return { cart: [], shipping: 0 };
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      // Legacy format: just cart array
      return { cart: parsed, shipping: 0 };
    }
    if (parsed && typeof parsed === 'object') {
      const cart = Array.isArray(parsed.cart) ? parsed.cart : [];
      const shipping = typeof parsed.shipping === 'number' ? parsed.shipping : 0;
      return { cart, shipping };
    }
    return { cart: [], shipping: 0 };
  } catch (e) {
    return { cart: [], shipping: 0 };
  }
}

export function computeGrandTotal(cart) {
  return cart.reduce((s, x) => s + x.price * x.qty, 0);
}

export function computeItemLabel(cart) {
  const itemLabel = cart.map((i) => `${i.qty}×${i.title}`).join(', ');
  return itemLabel.length > 127 ? itemLabel.slice(0, 124) + '...' : itemLabel;
}

export function renderSummaryToString(cart, shipping = 0) {
  if (!cart || !cart.length) return { html: '<p>Your cart is empty.</p>', total: 0 };
  const items = cart.map((it) => ({
    title: it.title,
    qty: it.qty,
    price: it.price.toFixed(2),
    lineTotal: (it.price * it.qty).toFixed(2),
  }));
  const subtotal = computeGrandTotal(cart);
  const ship = Number(Number(shipping || 0).toFixed(2));
  const grand = subtotal + ship;
  let html = '<ul class="checkout-line-items">';
  items.forEach((i) => {
    html += `<li class="checkout-line-item"><span class="line-title">${i.title}</span><span class="line-meta">${i.qty} × ${i.price}</span><span class="line-total">${i.lineTotal}</span></li>`;
  });
  html += `</ul><dl class="checkout-totals"><div><dt>Subtotal</dt><dd>${subtotal.toFixed(2)}</dd></div><div><dt>Shipping</dt><dd>${ship.toFixed(2)}</dd></div></dl><p class="grand-total">Total: <strong>${grand.toFixed(2)}</strong></p>`;
  return { html, total: grand };
}

export async function runCheckout({
  documentRoot = typeof document !== 'undefined' ? document : null,
  fetchPath = '/assets/js/data/paypal.json',
} = {}) {
  if (!documentRoot) return;
  const summary = documentRoot.getElementById('summary-content');
  const paymentSection = documentRoot.getElementById('payment');
  const errorEl = documentRoot.getElementById('checkout-error');
  if (!summary || !paymentSection) return;

  const showError = (msg) => {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
    const payBtn = documentRoot.getElementById('pay-now');
    if (payBtn) payBtn.disabled = true;
  };
  const clearError = () => {
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
    const payBtn = documentRoot.getElementById('pay-now');
    if (payBtn) payBtn.disabled = false;
  };

  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('naturesi_cart') : null;
  const { cart, shipping: savedShipping } = parseCartRaw(raw);
  if (!cart.length) {
    showError('Your cart is empty.');
    return;
  }

  // Use saved shipping, fallback to detecting from page
  let shipping = savedShipping;
  if (shipping === 0) {
    try {
      const shipEl = documentRoot.getElementById('summary-shipping');
      if (shipEl) {
        const ds = shipEl.dataset && shipEl.dataset.shipping;
        const txt = String(ds ?? shipEl.textContent ?? '').trim();
        const parsed = String(txt).replace(/[^\d.-]+/g, '');
        const n = Number(parsed || 0);
        if (Number.isFinite(n)) shipping = n;
      }
    } catch (e) {
      // ignore
    }
  }

  const { html, total } = renderSummaryToString(cart, shipping);
  summary.innerHTML = html;
}

// Note: runCheckout is now opt-in and should be invoked by the page script when progressive enhancement is desired.
// This prevents the checkout page from relying on JS for basic usability.
