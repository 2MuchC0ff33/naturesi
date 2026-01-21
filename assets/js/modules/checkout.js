// javascript
// Minimal checkout: read canonical cart, render summary, populate PayPal form and set action.
(async function () {
  const summary = document.getElementById('summary-content');
  const form = document.getElementById('paypal-form');
  const errorEl = document.getElementById('checkout-error');
  const payBtn = document.getElementById('pay-now');
  if (!summary || !form) return;

  const showError = (msg) => {
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); }
    if (payBtn) payBtn.disabled = true;
  };
  const clearError = () => {
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.add('hidden'); }
    if (payBtn) payBtn.disabled = false;
  };

  const readCart = () => {
    try {
      const raw = localStorage.getItem('naturesi_cart');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((it) => ({
        id: String(it.id ?? '').trim(),
        title: String(it.title ?? '').trim(),
        price: Number(it.price ?? 0),
        qty: Math.max(0, Math.trunc(Number(it.qty ?? 0)))
      })).filter((i) => i.id && i.title && i.qty > 0);
    } catch {
      return null;
    }
  };

  const render = (cart) => {
    summary.innerHTML = '';
    if (!cart || !cart.length) {
      summary.textContent = 'Your cart is empty.';
      return 0;
    }
    const ul = document.createElement('ul');
    ul.className = 'checkout-line-items';
    cart.forEach((it) => {
      const li = document.createElement('li');
      li.className = 'checkout-line-item';
      const title = document.createElement('span');
      title.className = 'line-title';
      title.textContent = it.title;
      const meta = document.createElement('span');
      meta.className = 'line-meta';
      meta.textContent = `${it.qty} × ${it.price.toFixed(2)}`;
      const total = document.createElement('span');
      total.className = 'line-total';
      total.textContent = (it.qty * it.price).toFixed(2);
      li.append(title, meta, total);
      ul.appendChild(li);
    });
    const grand = cart.reduce((s, x) => s + x.price * x.qty, 0);
    const p = document.createElement('p');
    p.className = 'grand-total';
    p.innerHTML = `Total: <strong>${grand.toFixed(2)}</strong>`;
    summary.appendChild(ul);
    summary.appendChild(p);
    return grand;
  };

  let cfg = null;
  try {
    const r = await fetch('/assets/js/data/paypal.json', { cache: 'no-store' });
    if (r.ok) cfg = await r.json();
  } catch (e) {
    console.error('Load config failed', e);
  }
  if (!cfg) { showError('Payment configuration unavailable.'); return; }

  const cart = readCart();
  if (cart === null) { showError('Your cart is invalid.'); return; }
  if (!cart.length) { showError('Your cart is empty.'); return; }

  const grand = render(cart);

  const businessEl = document.getElementById('pp-business');
  const itemEl = document.getElementById('pp-item_name');
  const amountEl = document.getElementById('pp-amount');
  const currencyEl = document.getElementById('pp-currency');
  const returnEl = document.getElementById('pp-return');
  const cancelEl = document.getElementById('pp-cancel');

  if (!cfg.business || !cfg.business.includes('@')) { showError('Merchant account not configured.'); return; }

  clearError();
  if (businessEl) businessEl.value = String(cfg.business);
  if (currencyEl && cfg.currency) currencyEl.value = String(cfg.currency);
  if (returnEl) returnEl.value = String(cfg.return_path);
  if (cancelEl) cancelEl.value = String(cfg.cancel_path);

  const itemLabel = cart.map((i) => `${i.qty}×${i.title}`).join(', ');
  if (itemEl) itemEl.value = itemLabel.length > 127 ? itemLabel.slice(0, 124) + '...' : itemLabel;

  if (amountEl) amountEl.value = Number(grand.toFixed(2)).toFixed(2);

  form.action = cfg.env && cfg.env.toLowerCase() === 'live' ? cfg.live_url : cfg.sandbox_url;
  if (!form.action || !businessEl.value) { showError('Invalid payment configuration.'); return; }

  const note = document.getElementById('checkout-note');
  if (note) note.textContent = `You will be redirected to PayPal to complete payment (currency: ${currencyEl.value}).`;
})();
