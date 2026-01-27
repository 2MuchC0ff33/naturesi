(function(){
  // Central search bootstrap: attaches to nav and search page
  const searchForm = document.querySelector('form#site-search-form');
  const searchInput = searchForm ? searchForm.querySelector('input[name="q"]') : document.querySelector('[data-search]');
  const resultsList = document.querySelector('[data-product-list]');
  const queryFromURL = new URLSearchParams(location.search).get('q') || '';
  const createW = () => (window.WorkerRegistry && window.WorkerRegistry.createWorker && window.WorkerRegistry.createWorker('/assets/js/workers/search-filter.worker.js')) || null;

  // Progressive enhancement: do nothing if no JS UI needed
  if (!searchInput && !resultsList) return;

  // If search page has query on load, set it
  if (searchInput && queryFromURL && !searchInput.value) searchInput.value = queryFromURL;

  // Shared worker wiring (optional): product cache
  let searchWorker = null;
  let cacheShared = null; let cachePort = null;
  try {
    if (window.WorkerRegistry && window.WorkerRegistry.supports && window.WorkerRegistry.supports.sharedWorker) {
      cacheShared = window.WorkerRegistry.createSharedWorker('/assets/js/shared/product-cache.shared-worker.js','product-cache');
      cachePort = cacheShared && cacheShared.port; if (cachePort) cachePort.start();
    }
  } catch(_){ }

  function initWorker(products){
    if (!searchWorker) searchWorker = createW();
    if (!searchWorker) return;
    window.__SEARCH_CACHE__ = products || [];
    searchWorker.onmessage = (e)=>{
      const msg = e.data || {};
      if (msg.type === 'RESULT' && resultsList) render(msg.items);
    };
    searchWorker.postMessage({ type:'INIT', products: products || [], options: { indexFields:['name','sku','category','brand','description'] } });
  }

  function render(items){
    if (!resultsList) return;
    resultsList.innerHTML = (items||[]).map(it => `<li><a href="/pages/store.html#${encodeURIComponent(it.sku || it.id)}">${escapeHTML(it.name||'')}</a> — $${Number(it.price||0).toFixed(2)}</li>`).join('');
  }

  function queryNow(q){ if (searchWorker) searchWorker.postMessage({ type:'QUERY', id:String(Date.now()), q, filters:{}, page:1, perPage:25 }); }

  async function bootstrap(){
    // Prefer shared cache
    if (cachePort){
      cachePort.onmessage = (e)=>{
        const m=e.data||{}; if (m.event==='CATALOG' && m.data) { initWorker(m.data); if (searchInput && searchInput.value) queryNow(searchInput.value); }
      };
      cachePort.postMessage({ action:'GET_CATALOG' });
    }
    // Fallback fetch
    if (!cachePort){
      try { const r = await fetch('/assets/js/data/products.json', { headers:{'Accept':'application/json'} }); const data = await r.json(); const products = data.products || data; initWorker(products); if (searchInput && searchInput.value) queryNow(searchInput.value); } catch(_){ }
    }
  }

  if (searchForm){
    // Ensure GET to /search.html with q
    try { searchForm.setAttribute('method','GET'); searchForm.setAttribute('action','/search.html'); } catch(_){}
  }

  if (searchInput){
    try { searchInput.setAttribute('name','q'); } catch(_){}
    searchInput.addEventListener('input', () => { if (searchWorker) queryNow(searchInput.value || ''); });
  }

  // Render initial results on search page load
  document.addEventListener('DOMContentLoaded', bootstrap);

  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }
})();
