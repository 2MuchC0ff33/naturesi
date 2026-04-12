h64455
s 00015/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
(()=> {
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
E 1
