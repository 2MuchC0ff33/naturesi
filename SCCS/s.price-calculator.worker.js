h02612
s 00076/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
let PRODUCT_INDEX = null;

self.onmessage = async (e) => {
  const msg = e.data || {};
  if (msg.type === 'INIT') {
    if (msg.productIndex && typeof msg.productIndex === 'object') PRODUCT_INDEX = msg.productIndex;
    return;
  }
  if (msg.type === 'CALC') {
    const { id, cartItems = [], address = {}, promoCodes = [] } = msg;

    if (!PRODUCT_INDEX) {
      try {
        const res = await fetch('/assets/js/data/products.json');
        const list = await res.json();
        const arr = Array.isArray(list) ? list : (list && list.products ? list.products : []);
        PRODUCT_INDEX = {};
        for (const p of arr) {
          const k = String(p.sku || p.id || '');
          if (k) PRODUCT_INDEX[k] = p;
        }
      } catch(_) { PRODUCT_INDEX = {}; }
    }

    const lines = [];
    for (const raw of cartItems) {
      const sku = String(raw && (raw.sku || raw.id) || '');
      const qty = Number(raw && (raw.qty != null ? raw.qty : 1)) || 1;
      const prod = PRODUCT_INDEX[sku] || null;
      const unit = prod && prod.price != null ? Number(prod.price) : Number(raw && raw.price);
      if (!sku || !isFinite(unit)) continue;
      const subtotal = round(unit * qty);
      lines.push({
        sku,
        name: (raw && raw.name) || (prod && (prod.name || prod.title)) || sku,
        qty,
        price: unit,
        subtotal
      });
    }

    const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
    const discounts = [];
    let discountTotal = 0;
    if (subtotal >= 500) {
      const d = round(subtotal * 0.05);
      discounts.push({ code: 'BULK5', amount: d });
      discountTotal += d;
    }
    (Array.isArray(promoCodes) ? promoCodes : []).forEach((code) => {
      const c = String(code || '').toUpperCase();
      if (c === 'WELCOME10') {
        const d = round(Math.min(50, subtotal * 0.10));
        discounts.push({ code: c, amount: d });
        discountTotal += d;
      }
    });

    const taxedBase = Math.max(0, subtotal - discountTotal);
    const region = (address.country || 'AU').toUpperCase();
    const taxRate = region === 'AU' ? 0.10 : 0.0;
    const tax = round(taxedBase * taxRate);

    let shipping = 0;
    if (taxedBase < 200) shipping = 12.95;
    if (address.express) shipping += 8.0;
    shipping = round(shipping);
    const total = round(taxedBase + tax + shipping);

    postMessage({ type: 'SUMMARY', id, lines, discounts, tax, shipping, total });
  }
};

function round(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
E 1
