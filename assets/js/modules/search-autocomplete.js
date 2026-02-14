(()=> {
  const input = document.querySelector('#site-search-q, #search-q, #site-search');
  if (!input) return;
  const listbox = document.createElement('ul');
  listbox.className = 'search-suggestions';
  listbox.setAttribute('role','listbox');
  listbox.id = 'search-suggestions-listbox';
  input.insertAdjacentElement('afterend', listbox);

  // ARIA attributes for combobox
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-owns', 'search-suggestions-listbox');

  let activeIndex = -1;

  function update(items){
    const html = (items||[]).slice(0,8).map((it, i)=>`<li id="suggestion-${i}" role="option" tabindex="-1"><a href="/pages/store.html#${encodeURIComponent(it.sku||it.id)}">${escapeHTML(it.name||'')}</a></li>`).join('');
    listbox.innerHTML = html;
    if (items?.length) {
      listbox.style.display = 'block';
      input.setAttribute('aria-expanded', 'true');
      activeIndex = 0;
      input.setAttribute('aria-activedescendant', 'suggestion-0');
    } else {
      listbox.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      activeIndex = -1;
    }
  }

  input.addEventListener('input', async () => {
    if (!window.WorkerRegistry) return;
    let products = window.__SEARCH_CACHE__;
    if (!products || !products.length) {
      try {
        const res = await fetch('/assets/js/data/products.json');
        const data = await res.json();
        products = data.products || data;
        window.__SEARCH_CACHE__ = products;
      } catch (e) {
        console.error('Failed to fetch products for autocomplete', e);
        return;
      }
    }
    const w = window.WorkerRegistry.createWorker?.('/assets/js/workers/search-filter.worker.js');
    if (!w) return;
    w.onmessage = (e)=>{ const m=e.data||{}; if (m.type==='RESULT') update(m.items); w.terminate(); };
    w.postMessage({ type:'INIT', products: products, options:{ indexFields:['name','sku','category','brand'] } });
    w.postMessage({ type:'QUERY', id:String(Date.now()), q: input.value || '', page:1, perPage:10 });
  });

  input.addEventListener('keydown', (e) => {
    if (!listbox.children.length) return;
    switch(e.key){
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, listbox.children.length - 1);
        input.setAttribute('aria-activedescendant', `suggestion-${activeIndex}`);
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        input.setAttribute('aria-activedescendant', `suggestion-${activeIndex}`);
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          const link = listbox.children[activeIndex].querySelector('a');
          if (link) link.click();
        }
        break;
      case 'Escape':
        listbox.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        activeIndex = -1;
        break;
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      listbox.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      activeIndex = -1;
    }, 150);
  });

  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }
})();
