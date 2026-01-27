(function(){
  const input = document.querySelector('#site-search-q, #search-q, #site-search');
  if (!input) return;
  const listbox = document.createElement('ul');
  listbox.className = 'search-suggestions';
  listbox.setAttribute('role','listbox');
  input.insertAdjacentElement('afterend', listbox);

  function update(items){ listbox.innerHTML = (items||[]).slice(0,8).map(it=>`<li role="option"><a href="/pages/store.html#${encodeURIComponent(it.sku||it.id)}">${escapeHTML(it.name||'')}</a></li>`).join(''); }

  input.addEventListener('input', () => {
    if (!window.WorkerRegistry) return;
    const w = window.WorkerRegistry.createWorker && window.WorkerRegistry.createWorker('/assets/js/workers/search-filter.worker.js');
    if (!w) return;
    w.onmessage = (e)=>{ const m=e.data||{}; if (m.type==='RESULT') update(m.items); w.terminate(); };
    w.postMessage({ type:'INIT', products: window.__SEARCH_CACHE__ || [], options:{ indexFields:['name','sku','category','brand'] } });
    w.postMessage({ type:'QUERY', id:String(Date.now()), q: input.value || '', page:1, perPage:10 });
  });

  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }
})();
