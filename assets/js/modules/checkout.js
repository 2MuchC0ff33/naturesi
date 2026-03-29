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
  return cart.reduce((s, x) => s + (Number(x.price) || 0) * (Number(x.qty) || 0), 0);
}

export function computeItemLabel(cart) {
  const itemLabel = cart.map((i) => `${i.qty}×${i.title}`).join(', ');
  return itemLabel.length > 127 ? itemLabel.slice(0, 124) + '...' : itemLabel;
}

export function renderSummaryToString(cart, shipping = 0) {
  if (!cart || !cart.length) return { html: '<p>Your cart is empty.</p>', total: 0 };
  const items = cart.map((it) => {
    const priceVal = Number(it.price) || 0;
    const qty = Number(it.qty) || 0;
    return {
      title: it.title,
      qty,
      price: priceVal.toFixed(2),
      lineTotal: (priceVal * qty).toFixed(2),
    };
  });
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
  const summary = documentRoot.querySelector('[data-checkout-summary-content]') || documentRoot.getElementById('summary-content');
  const paymentSection = documentRoot.querySelector('[data-checkout-payment]') || documentRoot.getElementById('payment');
  const errorEl = documentRoot.querySelector('[data-checkout-error]') || documentRoot.getElementById('checkout-error');
  if (!summary || !paymentSection) return;

  const showError = (msg) => {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
    const payBtn = documentRoot.querySelector('[data-pay-now]') || documentRoot.getElementById('pay-now') || documentRoot.getElementById('pay-now-redirect');
    if (payBtn) payBtn.disabled = true;
  };
  const clearError = () => {
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('u-hide');
    }
    const payBtn = documentRoot.querySelector('[data-pay-now]') || documentRoot.getElementById('pay-now') || documentRoot.getElementById('pay-now-redirect');
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

  // Offload price, tax and shipping calculation to worker when available
  const { html: fallbackHtml, total: fallbackTotal } = renderSummaryToString(cart, shipping);
  let usedWorker = false;
  if (window.WorkerRegistry && window.WorkerRegistry.supports && window.WorkerRegistry.supports.worker) {
    try {
      const w = window.WorkerRegistry.createWorker('/assets/js/workers/price-calculator.worker.js');
      if (w) {
        usedWorker = true;
        const payload = { type: 'CALC', id: String(Date.now()), cartItems: cart.map(i=>({ sku: i.sku||i.id, name: i.title||i.name, qty: i.qty, price: i.price })), address: {}, promoCodes: [] };
        w.onmessage = (ev) => {
          const msg = ev.data || {};
          if (msg.type === 'SUMMARY') {
            // Render worker-provided summary
            const parts = [];
            parts.push('<ul class="checkout-line-items">');
            msg.lines.forEach(l => parts.push(`<li class="checkout-line-item"><span class="line-title">${escapeHtml(l.name)}</span><span class="line-meta">${l.qty} × ${Number(l.price).toFixed(2)}</span><span class="line-total">${Number(l.subtotal).toFixed(2)}</span></li>`));
            parts.push('</ul>');
            parts.push(`<dl class="checkout-totals"><div><dt>Discounts</dt><dd>${msg.discounts.reduce((s,d)=>s+(d.amount||0),0).toFixed(2)}</dd></div><div><dt>Tax</dt><dd>${Number(msg.tax||0).toFixed(2)}</dd></div><div><dt>Shipping</dt><dd>${Number(msg.shipping||0).toFixed(2)}</dd></div></dl>`);
            parts.push(`<p class="grand-total">Total: <strong>$${Number(msg.total||0).toFixed(2)}</strong></p>`);
            summary.innerHTML = parts.join('');
            try { w.terminate(); } catch(_){}
          }
          if (msg.type === 'ERROR') {
            console.warn('Price worker error', msg.message);
            // fallback
            summary.innerHTML = fallbackHtml;
            try { w.terminate(); } catch(_){}
          }
        };
        w.postMessage(payload);
      }
    } catch (e) { console.warn('Worker calc failed', e); }
  }
  // fallback if worker not used
  if (!usedWorker) {
    summary.innerHTML = fallbackHtml;
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (c)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }


  // Ensure simple redirect form is populated even if PayPal SDK fails
  try {
    // do not block on this; populate redirect form if possible
    setupPaypalRedirect(documentRoot, cart, shipping, fetchPath).catch(() => {});
  } catch (e) {
    // ignore
  }

  // Fetch PayPal config and populate redirect form; SDK loading is optional and controlled by paypal.json
  let paypalData;
  try {
    paypalData = await fetch(fetchPath).then(r => r.json());
  } catch (e) {
    // If config fails, still allow redirect form to function (it will disable if merchant not configured)
    console.warn('Failed to load PayPal configuration, continuing with redirect form only.');
    paypalData = { useSdk: false };
  }

  // Populate the simple redirect form (always do this)
  try {
    await setupPaypalRedirect(documentRoot, cart, shipping, fetchPath);
  } catch (e) {
    console.warn('setupPaypalRedirect failed:', e);
  }

  // Prepare references to redirect form inputs so auto-submit can update them.
  const frmEl = documentRoot.querySelector('[data-paypal-redirect-form]') || documentRoot.getElementById('paypal-redirect-form');
  const amountInput = frmEl ? (frmEl.querySelector('input[name="amount"]') || frmEl.querySelector('[data-paypal-amount]')) : null;
  const itemNameInput = frmEl ? (frmEl.querySelector('input[name="item_name"]') || frmEl.querySelector('[data-paypal-item_name]')) : null;
  const invoiceInput = frmEl ? (frmEl.querySelector('input[name="invoice"]') || frmEl.querySelector('[data-paypal-invoice]')) : null;
  const debugEl = documentRoot.querySelector('[data-paypal-debug]') || documentRoot.getElementById('paypal-debug');

  // If auto checkout requested (from ?auto=1 or localStorage.autoCheckout), submit redirect form
  const urlParams = new URLSearchParams((typeof location !== 'undefined' ? location.search : ''));
  const autoFlag = urlParams.get('auto') === '1' || (typeof localStorage !== 'undefined' && localStorage.getItem('autoCheckout') === '1');
  if (autoFlag) {
    const frm = documentRoot.getElementById('paypal-redirect-form');
    const btn = documentRoot.getElementById('pay-now-redirect');
    // Small delay to allow form population and enabling; longer when debugging so you can inspect values
    const delay = (typeof debugOn !== 'undefined' && debugOn) ? 2000 : 250;
    setTimeout(() => {
      try {
        if (frm && btn && !btn.disabled) {
          // Refresh values just before submit
          if (amountInput) amountInput.value = (computeGrandTotal(cart) + Number(shipping || 0)).toFixed(2);
          if (itemNameInput) itemNameInput.value = computeItemLabel(cart);
          if (invoiceInput) invoiceInput.value = paypalData.invoice || `INV-${Date.now()}`;

          // Log form data for debugging
          try {
            const fd = new FormData(frm);
            for (const [k, v] of fd.entries()) {
              console.log('PayPal form', k, v);
            }
            if (typeof debugOn !== 'undefined' && debugOn && debugEl) {
              debugEl.textContent += '\n\nSubmitting with:\n' + Array.from(fd.entries()).map(([k, v]) => `${k}: ${v}`).join('\n');
            }
          } catch (e) {}

          // Clear localStorage flag if present
          if (typeof localStorage !== 'undefined') localStorage.removeItem('autoCheckout');

          // Indicate loading state to user (aria, class)
          try {
            btn.classList.add('is-loading');
            btn.setAttribute('aria-busy', 'true');
            btn.disabled = true;
          } catch (e) {}

          frm.submit();
        }
      } catch (e) {
        console.error('Auto-submit failed:', e);
      }
    }, delay);
    // Do not continue to try to load SDK in auto-only redirect flow unless configured
  }

  // Enforce redirect-only flow: do not load or render PayPal SDK here.
  if (paypalData && paypalData.useSdk) {
    console.warn('PayPal SDK requested by configuration but this deployment uses redirect-only flow. Skipping SDK load.');
    showError('PayPal SDK is disabled in this deployment; only redirect checkout is supported.');
    return;
  }

  clearError();
}

export async function setupPaypalRedirect(documentRoot, cart, shipping = 0, fetchPath = '/assets/js/data/paypal.json') {
  if (!documentRoot) return;
  const form = documentRoot.querySelector('[data-paypal-redirect-form]') || documentRoot.getElementById('paypal-redirect-form');
  const btn = documentRoot.querySelector('[data-pay-now]') || documentRoot.getElementById('pay-now-redirect');
  if (!form) return;

  let paypalData;
  try {
    paypalData = await fetch(fetchPath).then(r => r.json());
  } catch (e) {
    if (btn) btn.disabled = true;
    const note = documentRoot.getElementById('checkout-note');
    if (note) note.textContent = 'PayPal redirect unavailable (missing configuration).';
    return;
  }

  const env = paypalData.env || 'sandbox';
  const business = paypalData.sandboxMerchant || paypalData.email || '';
  form.action = env === 'sandbox' ? 'https://www.sandbox.paypal.com/cgi-bin/webscr' : 'https://www.paypal.com/cgi-bin/webscr';

  const businessInput = form.querySelector('input[name="business"]') || form.querySelector('[name="business"]');
  const itemNameInput = form.querySelector('input[name="item_name"]') || form.querySelector('[data-paypal-item_name]') || form.querySelector('[name="item_name"]');
  const amountInput = form.querySelector('input[name="amount"]') || form.querySelector('[data-paypal-amount]') || form.querySelector('[name="amount"]');
  const returnInput = form.querySelector('input[name="return"]') || form.querySelector('[name="return"]');
  const cancelInput = form.querySelector('input[name="cancel_return"]') || form.querySelector('[name="cancel_return"]');

  if (businessInput) businessInput.value = business;
  const totalValue = (computeGrandTotal(cart) + Number(shipping || 0)).toFixed(2);
  if (itemNameInput) itemNameInput.value = computeItemLabel(cart);
  if (amountInput) amountInput.value = totalValue;

  // Ensure PayPal returns to the merchant site by setting absolute URLs. Prefer values from paypal.json if provided.
  const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
  if (returnInput) returnInput.value = paypalData.returnUrl || (origin + '/pages/payment/success.html');
  if (cancelInput) cancelInput.value = paypalData.cancelUrl || (origin + '/pages/payment/fail.html');
  const notifyInput = form.querySelector('input[name="notify_url"]');
  const invoiceInput = form.querySelector('input[name="invoice"]');
  const rmInput = form.querySelector('input[name="rm"]');
  // Set notify_url (optional) and a simple invoice id to help reconciliation
  if (notifyInput) notifyInput.value = paypalData.notifyUrl || (origin + '/pages/payment/success.html');
  if (invoiceInput) invoiceInput.value = paypalData.invoice || `INV-${Date.now()}`;
  if (rmInput) rmInput.value = paypalData.rm || '2';

  // Debug UI: show prepared values when debug requested
  const debugEl = documentRoot.querySelector('[data-paypal-debug]') || documentRoot.getElementById('paypal-debug');
  const urlParams = new URLSearchParams((typeof location !== 'undefined' ? location.search : ''));
  const debugOn = urlParams.get('debug') === '1' || !!paypalData.debug;
  if (debugOn && debugEl) {
    debugEl.classList.remove('visually-hidden');
    const debugText = [
      `business: ${business}`,
      `amount: ${totalValue}`,
      `item_name: ${itemNameInput ? itemNameInput.value : ''}`,
      `return: ${returnInput ? returnInput.value : ''}`,
      `cancel_return: ${cancelInput ? cancelInput.value : ''}`,
      `rm: ${rmInput ? rmInput.value : ''}`,
      `notify_url: ${notifyInput ? notifyInput.value : ''}`,
      `invoice: ${invoiceInput ? invoiceInput.value : ''}`
    ].join('\n');
    debugEl.textContent = debugText;
  }

  if (!business) {
    if (btn) btn.disabled = true;
    const note = documentRoot.querySelector('[data-checkout-note]') || documentRoot.getElementById('checkout-note');
    if (note) note.textContent = 'PayPal redirect unavailable (merchant not configured).';
    return;
  }

  if (btn) {
    btn.disabled = false;
    // Refresh values just before submit
    form.addEventListener('submit', () => {
      if (amountInput) amountInput.value = (computeGrandTotal(cart) + Number(shipping || 0)).toFixed(2);
      if (itemNameInput) itemNameInput.value = computeItemLabel(cart);
    });
  }
}

export const toNumber = (v, fallback = 0) => {
  const s = String(v ?? '').trim();
  if (s === '') return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
};

export const normalizeCartItem = (s) => {
  const id = String(s.id ?? s.sku ?? '').trim();
  const title = String(s.title ?? s.name ?? '').trim();
  const price = toNumber(s.price, 0);
  const qty = Math.max(0, Math.trunc(toNumber(s.qty, 0)));
  if (!id || !title || qty <= 0) return undefined;
  return { id, title, price: Number(price), qty };
};

export function readCartFromDOM(documentRoot) {
  if (!documentRoot) return null;
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

export function readCartFromGlobal(globalObj) {
  if (Array.isArray(globalObj.naturesi_cart)) return globalObj.naturesi_cart;
  if (globalObj.naturesi_cart && Array.isArray(globalObj.naturesi_cart.items))
    return globalObj.naturesi_cart.items;
  if (Array.isArray(globalObj.__SAMPLE_CART__)) return globalObj.__SAMPLE_CART__;
  if (globalObj.__SAMPLE_CART__ && Array.isArray(globalObj.__SAMPLE_CART__.items))
    return globalObj.__SAMPLE_CART__.items;
  return null;
}

export function collectCartData({ documentRoot, globalObj } = {}) {
  const src = readCartFromGlobal(globalObj) || readCartFromDOM(documentRoot) || [];
  const out = [];
  for (const s of src) {
    const it = normalizeCartItem(s);
    if (it) out.push(it);
  }
  return out;
}

export function saveCartToStorage(cart, { storage, key = 'naturesi_cart' } = {}) {
  try {
    if (!storage) return false;
    const srcArr = Array.isArray(cart) ? cart : (cart?.items ?? []);
    const out = (srcArr || []).map(normalizeCartItem).filter(Boolean);
    storage.setItem(key, JSON.stringify(out));
    return true;
  } catch (e) {
    console.error('Error saving cart', e);
    return false;
  }
}

export function attachFormHandler({ documentRoot, storage, key = 'naturesi_cart' } = {}) {
  if (!documentRoot || !documentRoot.getElementById) return;
  const form = documentRoot.getElementById('confirm-cart-form');
  if (!form) return;

  form.addEventListener('submit', (evt) => {
    try {
      const cart = collectCartData({ documentRoot });
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
        const shippingEl = documentRoot.getElementById('summary-shipping');
        if (shippingEl && shippingEl.textContent.trim() === 'Calculated at checkout') {
          let errorEl = documentRoot.getElementById('checkout-error');
          if (!errorEl) {
            errorEl = documentRoot.createElement('p');
            errorEl.id = 'checkout-error';
            errorEl.className = 'error-message';
            errorEl.setAttribute('role', 'alert');
            errorEl.textContent =
              'Please enter a valid postcode to calculate shipping costs before proceeding to checkout.';
            const container =
              documentRoot.querySelector('.cart-actions-external') || documentRoot.body;
            container.insertBefore(errorEl, container.firstChild);
          }
          return;
        }
        const existingError = documentRoot.getElementById('checkout-error');
        if (existingError) existingError.remove();

        const cart = collectCartData({ documentRoot });
        let shippingCost = 0;
        if (shippingEl) {
          const shippingText = shippingEl.textContent.trim();
          const match = shippingText.match(/AUD \$(\d+\.\d+)/);
          if (match) shippingCost = parseFloat(match[1]);
        }
        const cartData = { cart, shipping: shippingCost };
        if (storage) storage.setItem(key, JSON.stringify(cartData));

        if (!documentRoot.getElementById('checkout-save-note')) {
          const note = documentRoot.createElement('p');
          note.id = 'checkout-save-note';
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
          if (globalThis && globalThis.location) globalThis.location.assign('/pages/checkout.html');
        }
      } catch (err) {
        console.error('Proceed click handler failed', err);
        if (globalThis && globalThis.location) globalThis.location.assign('/pages/checkout.html');
      }
    });
  }
}
