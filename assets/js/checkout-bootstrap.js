(function(){
  const calcEl = document.querySelector('[data-checkout-summary]');
  const form = document.querySelector('form[data-checkout-form]');
  const methodRadios = document.querySelectorAll('input[name="paymentMethod"]');
  const DEBUG = !!(window.checkoutDebug || (window.paypal && window.paypal.debug));

  function currentPaymentMethod(){
    const sel = document.querySelector('input[name="paymentMethod"]:checked');
    return sel ? sel.value : '';
  }

  async function canonicalCart(){
    await window.PricingIndex.load();
    const idx = window.PricingIndex.get();
    const stored = window.CartStore && window.CartStore.get();
    const items = (stored && stored.items) ? stored.items : [];
    const out = [];
    for (const it of items){
      const sku = String(it.sku || it.id || '');
      const prod = idx[sku];
      const qty = Number(it.qty || it.quantity || 1) || 1;
      const price = prod && prod.price != null ? Number(prod.price) : Number(it.price);
      if (!sku || !isFinite(price)) continue;
      out.push({ sku, name: it.name || (prod && (prod.name||prod.title)) || sku, qty, price });
    }
    return { items: out };
  }

  function renderSummary(sum){
    if (!calcEl) return;
    const disc = (sum.discounts||[]).reduce((s,d)=>s+d.amount,0);
    calcEl.innerHTML = `Subtotal lines: ${sum.lines.length} | Discounts: $${disc.toFixed(2)} | Tax: $${sum.tax.toFixed(2)} | Shipping: $${sum.shipping.toFixed(2)} | Total: $${sum.total.toFixed(2)}`;
  }

  async function recalcAndRender(){
    const address = window.checkoutAddress || {};
    const promoCodes = (window.checkoutPromos || []);
    const id = String(Date.now());
    const cart = await canonicalCart();

    return new Promise((resolve) => {
      if (window.WorkerRegistry && window.WorkerRegistry.supports.worker){
        const w = window.WorkerRegistry.createWorker('/assets/js/workers/price-calculator.worker.js');
        if (w){
          const idx = window.PricingIndex.get();
          w.postMessage({ type: 'INIT', productIndex: idx });
          w.onmessage = (e) => { const msg = e.data || {}; if (msg.type === 'SUMMARY'){ renderSummary(msg); w.terminate(); resolve(msg); } };
          w.postMessage({ type: 'CALC', id, cartItems: cart.items, address, promoCodes });
          return;
        }
      }
      const total = cart.items.reduce((s,it)=> s + (Number(it.price||0)*Number(it.qty||1)), 0);
      const sum = { lines: cart.items.map(it=>({ sku: it.sku, qty: it.qty, price: it.price, subtotal: Math.round(it.qty*it.price*100)/100 })), discounts: [], tax: 0, shipping: 0, total: Math.round(total*100)/100 };
      renderSummary(sum); resolve(sum);
    });
  }

  async function verifyBeforePayPal(sum){
    const cart = await canonicalCart();
    const recomputed = cart.items.reduce((s,it)=> s + (Number(it.price||0)*Number(it.qty||1)), 0);
    const recomputedRounded = Math.round(recomputed*100)/100;
    const workerTotal = sum && typeof sum.total === 'number' ? sum.total : recomputedRounded;
    const mismatch = Math.abs(workerTotal - recomputedRounded) > 0.01;
    if (DEBUG) console.debug('checkout-verify', { workerTotal, recomputedRounded, sum, cart });
    if (mismatch){
      alert('Price verification failed. Please refresh the page and try again.');
      return false;
    }
    const totalField = document.querySelector('input[name="amount"]'); if (totalField) totalField.value = String(recomputedRounded.toFixed(2));
    return true;
  }

  if (form){
    form.addEventListener('submit', async function(ev){
      const method = currentPaymentMethod();
      if (method === 'paypal') {
        const sum = await recalcAndRender();
        const ok = await verifyBeforePayPal(sum);
        if (!ok){ ev.preventDefault(); return false; }
        return true;
      }
      return true;
    });
  }

  document.addEventListener('DOMContentLoaded', recalcAndRender);
  (methodRadios || []).forEach(r => r.addEventListener('change', recalcAndRender));
})();
