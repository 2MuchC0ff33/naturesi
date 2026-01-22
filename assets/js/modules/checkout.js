// Checkout helpers exported for testing + guarded browser runner
export function parseCartRaw(raw) {
  try {
    if (!raw) return [];
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((it) => ({
        id: String(it.id ?? '').trim(),
        title: String(it.title ?? it.name ?? '').trim(),
        price: Number(it.price ?? 0),
        qty: Math.max(0, Math.trunc(Number(it.qty ?? it.quantity ?? 0))),
      }))
      .filter((i) => i.id && i.title && i.qty > 0);
  } catch (e) {
    return null;
  }
}

export function computeGrandTotal(cart) {
  return cart.reduce((s, x) => s + x.price * x.qty, 0);
}

export function computeItemLabel(cart) {
  const itemLabel = cart.map((i) => `${i.qty}×${i.title}`).join(', ');
  return itemLabel.length > 127 ? itemLabel.slice(0, 124) + '...' : itemLabel;
}

export async function loadPayPalConfig(path = '/assets/js/data/paypal.json', retries = 1) {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(path, { cache: 'no-store' });
      if (r.ok) return await r.json();
    } catch (e) {
      // fall through to retry
    }
    if (i < retries) await sleep(150 * (i + 1));
  }
  return null;
}

export function buildPayPalPayload(cfg, cart) {
  const errors = [];
  if (!cfg) errors.push('missing_config');
  if (!cfg?.business || !String(cfg.business).includes('@')) errors.push('invalid_business');
  const grand = computeGrandTotal(cart);
  const payload = {
    business: cfg?.business ?? '',
    item_name: computeItemLabel(cart),
    amount: Number(grand.toFixed(2)).toFixed(2),
    currency_code: cfg?.currency ?? 'AUD',
    return: cfg?.return_path ?? '',
    cancel_return: cfg?.cancel_path ?? '',
    action: cfg?.env && String(cfg.env).toLowerCase() === 'live' ? cfg?.live_url : cfg?.sandbox_url,
  };
  return { payload, errors };
}

export function renderSummaryToString(cart) {
  if (!cart || !cart.length) return { html: '<p>Your cart is empty.</p>', total: 0 };
  const items = cart.map((it) => ({
    title: it.title,
    qty: it.qty,
    price: it.price.toFixed(2),
    lineTotal: (it.price * it.qty).toFixed(2),
  }));
  const grand = computeGrandTotal(cart);
  let html = '<ul class="checkout-line-items">';
  items.forEach((i) => {
    html += `<li class="checkout-line-item"><span class="line-title">${i.title}</span><span class="line-meta">${i.qty} × ${i.price}</span><span class="line-total">${i.lineTotal}</span></li>`;
  });
  html += `</ul><p class="grand-total">Total: <strong>${grand.toFixed(2)}</strong></p>`;
  return { html, total: grand };
}

export async function runCheckout({
  documentRoot = typeof document !== 'undefined' ? document : null,
  fetchPath = '/assets/js/data/paypal.json',
} = {}) {
  if (!documentRoot) return;
  const summary = documentRoot.getElementById('summary-content');
  const form = documentRoot.getElementById('paypal-form');
  const errorEl = documentRoot.getElementById('checkout-error');
  const payBtn = documentRoot.getElementById('pay-now');
  if (!summary || !form) return;
  const showError = (msg) => {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
    if (payBtn) payBtn.disabled = true;
  };
  const clearError = () => {
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
    if (payBtn) payBtn.disabled = false;
  };

  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('naturesi_cart') : null;
  const cart = parseCartRaw(raw);
  if (cart === null) {
    showError('Your cart is invalid.');
    return;
  }
  if (!cart.length) {
    showError('Your cart is empty.');
    return;
  }

  const { html, total } = renderSummaryToString(cart);
  summary.innerHTML = html;

  const cfg = await loadPayPalConfig(fetchPath);
  const { payload, errors } = buildPayPalPayload(cfg, cart);

  if (errors.length) {
    showError('Invalid payment configuration.');
    return;
  }

  const businessEl = documentRoot.getElementById('pp-business');
  const itemEl = documentRoot.getElementById('pp-item_name');
  const amountEl = documentRoot.getElementById('pp-amount');
  const currencyEl = documentRoot.getElementById('pp-currency');
  const returnEl = documentRoot.getElementById('pp-return');
  const cancelEl = documentRoot.getElementById('pp-cancel');

  clearError();
  if (businessEl) businessEl.value = String(payload.business);
  if (currencyEl) currencyEl.value = String(payload.currency_code);
  if (returnEl) returnEl.value = String(payload.return);
  if (cancelEl) cancelEl.value = String(payload.cancel_return);
  if (itemEl) itemEl.value = payload.item_name;
  if (amountEl) amountEl.value = payload.amount;

  form.action = payload.action;
  if (!form.action || !businessEl.value) {
    showError('Invalid payment configuration.');
    return;
  }

  const note = documentRoot.getElementById('checkout-note');
  if (note)
    note.textContent = `You will be redirected to PayPal to complete payment (currency: ${payload.currency_code}).`;
}

// Auto-run only in browser
if (typeof document !== 'undefined') {
  (async () => {
    try {
      await runCheckout();
    } catch (e) {}
  })();
}
