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
      errorEl.classList.add('u-hide');
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

  // If useSdk is explicitly true, load SDK and render buttons (optional)
  if (paypalData && paypalData.useSdk) {
    if (!paypalData.clientId) {
      showError('PayPal client ID not configured for SDK.');
      return;
    }

    if (!window.paypal) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalData.clientId}&currency=USD`;
      document.head.appendChild(script);
      try {
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load PayPal SDK script.'));
        });
      } catch (e) {
        showError('Failed to load PayPal SDK. Please check your connection and client ID.');
        console.error('PayPal SDK load error:', e);
        return;
      }
    }

    // Render PayPal buttons (if container present)
    const paypalButtonContainer = documentRoot.getElementById('paypal-button-container');
    if (!paypalButtonContainer) {
      showError('PayPal button container not found.');
      return;
    }

    paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: total.toFixed(2)
            },
            items: cart.map(item => ({
              name: item.title,
              quantity: (Number(item.qty) || 0).toString(),
              unit_amount: {
                currency_code: 'USD',
                value: (Number(item.price) || 0).toFixed(2)
              }
            }))
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('naturesi_cart');
            localStorage.removeItem('naturesi-cart');
          }
          window.location.href = '/pages/payment/success.html';
        });
      },
      onCancel: function(data) {
        window.location.href = '/pages/payment/cancel.html';
      },
      onError: function(err) {
        showError('PayPal payment failed. Please try again.');
        console.error('PayPal error:', err);
      }
    }).render('#paypal-button-container');
  }

  clearError();
}

export async function setupPaypalRedirect(documentRoot, cart, shipping = 0, fetchPath = '/assets/js/data/paypal.json') {
  if (!documentRoot) return;
  const form = documentRoot.getElementById('paypal-redirect-form');
  const btn = documentRoot.getElementById('pay-now-redirect');
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

  const businessInput = form.querySelector('input[name="business"]');
  const itemNameInput = form.querySelector('input[name="item_name"]');
  const amountInput = form.querySelector('input[name="amount"]');
  const returnInput = form.querySelector('input[name="return"]');
  const cancelInput = form.querySelector('input[name="cancel_return"]');

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
  const debugEl = documentRoot.getElementById('paypal-debug');
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
    const note = documentRoot.getElementById('checkout-note');
    if (note) note.textContent = 'PayPal redirect unavailable (merchant not configured).';
    return;
  }

  if (btn) {
    btn.disabled = false;
    // Refresh values just before submit
    form.addEventListener('submit', function () {
      if (amountInput) amountInput.value = (computeGrandTotal(cart) + Number(shipping || 0)).toFixed(2);
      if (itemNameInput) itemNameInput.value = computeItemLabel(cart);
    });
  }
}
