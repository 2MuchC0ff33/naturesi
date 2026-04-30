import { escapeHtml } from './html.js';

// Checkout helpers exported for testing + guarded browser runner
export function parseCartRaw(raw) {
  try {
    if (!raw) return { cart: [], shipping: 0 };
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return { cart: parsed, shipping: 0 };
    }
    if (parsed && typeof parsed === 'object') {
      // Support checkout format {cart:[…], shipping:N} and CartStore format {items:[…]}
      let cart;
      if (Array.isArray(parsed.cart)) {
        cart = parsed.cart;
      } else if (Array.isArray(parsed.items)) {
        cart = parsed.items;
      } else {
        cart = [];
      }
      const shipping = typeof parsed.shipping === 'number' ? parsed.shipping : 0;
      return { cart, shipping };
    }
    return { cart: [], shipping: 0 };
  } catch (e) {
    return { cart: [], shipping: 0 };
  }
}

export function computeGrandTotal(cart) {
  return cart.reduce((s, x) => s + (Number(x.price) || 0) * (Number(x.qty ?? x.quantity) || 0), 0);
}

export function computeItemLabel(cart) {
  const itemLabel = cart
    .map((i) => `${i.qty ?? i.quantity}×${i.title ?? i.name}`)
    .join(', ');
  return itemLabel.length > 127 ? itemLabel.slice(0, 124) + '...' : itemLabel;
}

export function renderSummaryToString(cart, shipping = 0) {
  if (!cart || !cart.length) return { html: '<p>Your cart is empty.</p>', total: 0 };
  const items = cart.map((it) => {
    const priceVal = Number(it.price) || 0;
    const qty = Number(it.qty ?? it.quantity) || 0;
    const title = it.title ?? it.name ?? '';
    return {
      title,
      qty,
      price: priceVal.toFixed(2),
      lineTotal: (priceVal * qty).toFixed(2)
    };
  });
  const subtotal = computeGrandTotal(cart);
  const ship = Number(Number(shipping || 0).toFixed(2));
  const grand = subtotal + ship;
  let html = '<ul class="checkout-line-items">';
  items.forEach((i) => {
    html += `<li class="checkout-line-item"><span class="line-title">${i.title}</span><span class="line-meta">${i.qty} × ${i.price}</span><span class="line-total">${i.lineTotal}</span></li>`;
  });
  html += `</ul><dl class="checkout-totals"><div><dt>Subtotal</dt><dd>${subtotal.toFixed(2)}</dd></div><div><dt>Shipping</dt><dd>${ship.toFixed(2)}</dd></div></dl><p class="grand-total">Total: <strong>$${grand.toFixed(2)}</strong></p>`;
  return { html, total: grand };
}

export async function runCheckout({
  documentRoot = typeof document !== 'undefined' ? document : null,
  fetchPath = '/assets/js/data/paypal.json'
} = {}) {
  if (!documentRoot) return;
  const summary =
    documentRoot.querySelector('[data-checkout-summary-content]') ||
    documentRoot.getElementById('summary-content');
  const paymentSection =
    documentRoot.querySelector('[data-checkout-payment]') || documentRoot.getElementById('payment');
  const errorEl =
    documentRoot.querySelector('[data-checkout-error]') ||
    documentRoot.getElementById('checkout-error');
  if (!summary || !paymentSection) return;

  const showError = (msg) => {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
  };
  const clearError = () => {
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  };

  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('naturesi_cart') : null;
  const { cart, shipping: savedShipping } = parseCartRaw(raw);
  if (!cart.length) {
    showError('Your cart is empty.');
    return;
  }

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
    } catch (_) {}
  }

  const { html: fallbackHtml } = renderSummaryToString(cart, shipping);
  let usedWorker = false;
  if (
    window.WorkerRegistry &&
    window.WorkerRegistry.supports &&
    window.WorkerRegistry.supports.worker
  ) {
    try {
      const w = window.WorkerRegistry.createWorker('/assets/js/workers/price-calculator.worker.js');
      if (w) {
        usedWorker = true;
        const payload = {
          type: 'CALC',
          id: String(Date.now()),
          cartItems: cart.map((i) => ({
            sku: i.sku || i.id,
            name: i.title || i.name,
            qty: i.qty,
            price: i.price
          })),
          address: {},
          promoCodes: []
        };
        w.onmessage = (ev) => {
          const msg = ev.data || {};
          if (msg.type === 'SUMMARY') {
            const parts = [];
            parts.push('<ul class="checkout-line-items">');
            msg.lines.forEach((l) =>
              parts.push(
                `<li class="checkout-line-item"><span class="line-title">${escapeHtml(l.name)}</span><span class="line-meta">${l.qty} × ${Number(l.price).toFixed(2)}</span><span class="line-total">${Number(l.subtotal).toFixed(2)}</span></li>`
              )
            );
            parts.push('</ul>');
            parts.push(
              `<dl class="checkout-totals"><div><dt>Discounts</dt><dd>${msg.discounts.reduce((s, d) => s + (d.amount || 0), 0).toFixed(2)}</dd></div><div><dt>Tax</dt><dd>${Number(msg.tax || 0).toFixed(2)}</dd></div><div><dt>Shipping</dt><dd>${Number(msg.shipping || 0).toFixed(2)}</dd></div></dl>`
            );
            parts.push(
              `<p class="grand-total">Total: <strong>$${Number(msg.total || 0).toFixed(2)}</strong></p>`
            );
            summary.innerHTML = parts.join('');
            try {
              w.terminate();
            } catch (_) {}
          }
          if (msg.type === 'ERROR') {
            console.warn('Price worker error', msg.message);
            summary.innerHTML = fallbackHtml;
            try {
              w.terminate();
            } catch (_) {}
          }
        };
        w.postMessage(payload);
      }
    } catch (e) {
      console.warn('Worker calc failed', e);
    }
  }
  if (!usedWorker) {
    summary.innerHTML = fallbackHtml;
  }

  let paypalData;
  try {
    paypalData = await fetch(fetchPath).then((r) => r.json());
  } catch (e) {
    showError('Failed to load PayPal configuration. Please refresh and try again.');
    return;
  }

  if (!paypalData.useSdk) {
    showError('PayPal SDK is not configured. Please contact support.');
    return;
  }

  clearError();
  await setupPayPalSDK(documentRoot, cart, shipping, paypalData);
}

export async function setupPayPalSDK(documentRoot, cart, shipping, paypalData) {
  const container =
    documentRoot.querySelector('[data-paypal-button]') ||
    documentRoot.getElementById('paypal-button-container');
  if (!container) return;

  const total = (computeGrandTotal(cart) + Number(shipping || 0)).toFixed(2);
  const currency = paypalData.currency || 'AUD';
  const intent = paypalData.intent || 'CAPTURE';
  const clientId = paypalData.clientId;
  const errorEl =
    documentRoot.querySelector('[data-checkout-error]') ||
    documentRoot.getElementById('checkout-error');
  const noteEl =
    documentRoot.querySelector('[data-checkout-note]') ||
    documentRoot.getElementById('checkout-note');

  const showError = (msg) => {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
  };

  const showMessage = (msg) => {
    if (noteEl) {
      noteEl.textContent = msg;
    }
  };

  const sdkUrl = new URL('https://www.paypal.com/sdk/js');
  sdkUrl.searchParams.set('client-id', clientId);
  sdkUrl.searchParams.set('currency', currency);
  sdkUrl.searchParams.set('intent', intent);
  sdkUrl.searchParams.set('components', 'buttons');
  sdkUrl.searchParams.set('commit', 'true');
  if (paypalData.merchantId) {
    sdkUrl.searchParams.set('merchant-id', paypalData.merchantId);
  }

  const loadSdk = () => {
    return new Promise((resolve) => {
      if (window.paypal && window.paypal.Buttons) {
        resolve();
        return;
      }
      const existing = documentRoot.querySelector(
        'script[src*="paypal.com/sdk"][src*="client-id"]'
      );
      if (existing) {
        const check = setInterval(() => {
          if (window.paypal && window.paypal.Buttons) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          showError('PayPal SDK failed to load. Please check your connection and refresh.');
        }, 10000);
        return;
      }
      const script = documentRoot.createElement('script');
      script.src = sdkUrl.toString();
      script.onload = () => resolve();
      script.onerror = () => showError('Failed to load PayPal SDK. Please refresh the page.');
      documentRoot.head
        ? documentRoot.head.appendChild(script)
        : documentRoot.body.appendChild(script);
    });
  };

  await loadSdk();

  if (!window.paypal || !window.paypal.Buttons) {
    showError('PayPal SDK unavailable. Please refresh or contact support.');
    return;
  }

  const purchaseUnits = [
    {
      amount: {
        currency_code: currency,
        value: total,
        breakdown: {
          item_total: {
            currency_code: currency,
            value: computeGrandTotal(cart).toFixed(2)
          },
          shipping: {
            currency_code: currency,
            value: Number(shipping || 0).toFixed(2)
          }
        }
      },
      items: cart.map((item) => ({
        name: String(item.title || item.name || item.id || 'Item').slice(0, 127),
        unit_amount: {
          currency_code: currency,
          value: Number(item.price || 0).toFixed(2)
        },
        quantity: String(item.qty ?? item.quantity ?? 1)
      }))
    }
  ];

  const buttonEl = documentRoot.getElementById('paypal-button-container');
  if (buttonEl) {
    buttonEl.innerHTML = '';
  }

  window.paypal
    .Buttons({
      intent: intent.toLowerCase(),
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      },
      onClick: (_data, actions) => {
        if (!cart || !cart.length) {
          showError('Your cart is empty.');
          return actions.reject();
        }
        return actions.resolve();
      },
      createOrder: (_data, actions) => {
        return actions.order.create({
          intent: intent.toUpperCase(),
          purchase_units: purchaseUnits
        });
      },
      onApprove: async (data, actions) => {
        try {
          showMessage('Finalising your PayPal payment…');
          const order = await actions.order.capture();
          if (!order || order.status !== 'COMPLETED') {
            showError(
              `PayPal returned status: ${order?.status || 'unknown'}. Your cart has been kept so you can try again.`
            );
            return;
          }
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(
              'naturesi_last_order',
              JSON.stringify({
                orderId: order.id || data.orderID,
                captureId:
                  order.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
                  order.purchase_units?.[0]?.payments?.authorizations?.[0]?.id ||
                  '',
                status: order.status,
                cart: cart,
                total: total,
                timestamp: Date.now()
              })
            );
            localStorage.removeItem('naturesi_cart');
          }
          if (typeof location !== 'undefined') {
            location.href = `/pages/payment/success.html?orderId=${encodeURIComponent(
              order.id || data.orderID
            )}`;
          }
        } catch (e) {
          console.error('Payment approval handler error:', e);
          showError(
            'Your PayPal payment could not be finalised. Please refresh and try again, or contact support before placing another order.'
          );
        }
      },
      onCancel: () => {
        showMessage('Payment cancelled — your cart is intact.');
      },
      onError: (err) => {
        console.error('PayPal SDK error:', err);
        showError('Payment failed. Please try again or contact support.');
      }
    })
    .render(container);
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
