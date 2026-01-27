// Dedicated Worker: Price Calculator (JSON in/out)
self.onmessage = (e) => {
  try {
    const msg = e.data || {};
    if (msg.type !== 'CALC') return;
    const { id, cartItems = [], address = {}, promoCodes = [] } = msg;

    const lines = cartItems.map(item => {
      const qty = Number(item.qty || 1);
      const price = Number(item.price || 0);
      const lineSubtotal = qty * price;
      return { sku: item.sku, name: item.name || item.title || '', qty, price, subtotal: round(lineSubtotal) };
    });

    const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);

    // Simple discount rules
    const discounts = [];
    let discountTotal = 0;
    if (subtotal >= 500) { // bulk discount 5%
      const d = round(subtotal * 0.05); discounts.push({ code: 'BULK5', amount: d }); discountTotal += d;
    }
    if (Array.isArray(promoCodes)) {
      promoCodes.forEach(code => {
        if (!code) return;
        const c = String(code).toUpperCase();
        if (c === 'WELCOME10') { const d = round(Math.min(50, subtotal * 0.10)); discounts.push({ code: c, amount: d }); discountTotal += d; }
      });
    }

    const taxedBase = Math.max(0, subtotal - discountTotal);
    const region = (address.country || 'AU').toUpperCase();
    // AU GST example 10%
    const taxRate = region === 'AU' ? 0.10 : 0.0;
    const tax = round(taxedBase * taxRate);

    // Simple shipping logic
    let shipping = 0;
    if (taxedBase < 200) shipping = 12.95;
    if (address.express) shipping += 8.0;
    shipping = round(shipping);

    const total = round(taxedBase + tax + shipping);

    postMessage({ type: 'SUMMARY', id, lines, discounts, tax, shipping, total });
  } catch (err) {
    postMessage({ type: 'ERROR', message: String(err && err.message || err) });
  }
};

function round(n){ return Math.round((n + Number.EPSILON) * 100) / 100; }
