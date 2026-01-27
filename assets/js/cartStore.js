(function(){
  const listeners = new Set();

  function emit(cart){ listeners.forEach(fn => { try { fn(cart); } catch(_){} }); }
  function getLocal(){ try { return JSON.parse(localStorage.getItem('cart')||'{"items":[]}'); } catch(_) { return { items: [] }; } }
  function setLocal(c){ localStorage.setItem('cart', JSON.stringify(c)); emit(c); }

  function normaliseItem(raw, product){
    const sku = (raw && (raw.sku || raw.id)) ? String(raw.sku || raw.id) : '';
    const qty = Number(raw && (raw.qty != null ? raw.qty : (raw.quantity != null ? raw.quantity : 1))) || 1;
    const name = raw && (raw.name || (product && (product.name || product.title))) || '';
    const priceFromDom = Number(raw && raw.price);
    const price = (product && product.price != null) ? Number(product.price) : (isFinite(priceFromDom) ? priceFromDom : null);
    return { sku, name, qty, price };
  }

  async function canonicalise(cart){
    await window.PricingIndex.load();
    const idx = window.PricingIndex.get();
    const items = Array.isArray(cart && cart.items) ? cart.items : Array.isArray(cart) ? cart : [];
    const out = [];
    for (const it of items){
      const product = idx ? idx[String(it.sku || it.id || '')] : null;
      const norm = normaliseItem(it, product);
      if (norm.price == null) { console.warn('cartStore: dropping item without price', norm); continue; }
      out.push(norm);
    }
    return { items: out };
  }

  window.CartStore = {
    subscribe: (fn)=>listeners.add(fn),
    unsubscribe: (fn)=>listeners.delete(fn),
    get: ()=>{ const c = getLocal(); return c && c.items ? c : { items: [] }; },
    set: async (cart)=>{ const canon = await canonicalise(cart); setLocal(canon); },
    add: async (raw)=>{
      const cur = window.CartStore.get();
      const idx = await window.PricingIndex.load().then(()=>window.PricingIndex.get());
      const product = idx ? idx[String(raw && (raw.sku || raw.id) || '')] : null;
      const item = normaliseItem(raw, product);
      if (!item.sku) return;
      if (item.price == null) { alert('This item is currently unavailable for purchase.'); return; }
      const next = { items: (cur.items || []).slice() };
      const existing = next.items.find(x => x.sku === item.sku);
      if (existing) existing.qty += item.qty; else next.items.push(item);
      setLocal(next);
    },
    remove: (sku)=>{ const cur = getLocal(); const next = { items: (cur.items||[]).filter(x => x.sku !== String(sku)) }; setLocal(next); },
    clear: ()=>{ setLocal({ items: [] }); }
  };
})();
