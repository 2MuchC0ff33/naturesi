(function(){
  document.addEventListener('DOMContentLoaded', async ()=>{
    try {
      await window.PricingIndex.load();
      const idx = window.PricingIndex.get();
      document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
        const sku = btn.getAttribute('data-sku') || btn.getAttribute('data-id') || '';
        const p = idx && sku ? idx[String(sku)] : null;
        const priceAttr = Number(btn.getAttribute('data-price'));
        const price = p && p.price != null ? Number(p.price) : (isFinite(priceAttr) ? priceAttr : null);
        if (price == null){ btn.setAttribute('disabled','disabled'); btn.title = 'Unavailable'; }
      });
    } catch(_){}
  });
})();
