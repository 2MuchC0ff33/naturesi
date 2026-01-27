(function(){
  let _index = null; // Map by sku and id
  let _list = null;
  let _loading = null;

  async function load(){
    if (_loading) return _loading;
    _loading = (async () => {
      try {
        const res = await fetch('/assets/js/data/products.json', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        index(data && data.products ? data.products : data);
        return _index;
      } catch (e){ console.warn('pricing-index: failed to load products.json', e); _index = {}; _list = []; return _index; }
    })();
    return _loading;
  }

  function index(list){
    _index = Object.create(null);
    _list = Array.isArray(list) ? list : [];
    for (const p of _list){
      if (!p) continue;
      const sku = (p.sku || p.id || '').toString();
      if (!sku) continue;
      _index[sku] = p;
      if (p.id && p.id !== p.sku) _index[p.id.toString()] = p;
    }
  }

  function get(){ return _index; }
  function list(){ return _list; }
  function has(){ return !!_index; }
  function resolve(sku){ if (!_index) return null; return _index[(sku||'').toString()] || null; }

  window.PricingIndex = { load, get, list, has, resolve };
})();
