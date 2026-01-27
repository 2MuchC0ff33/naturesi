// Dedicated Worker: Search & Filter
let index = [];
let indexFields = ['name','sku','category'];

self.onmessage = (e) => {
  const msg = e.data || {};
  if (msg.type === 'INIT') {
    index = Array.isArray(msg.products) ? msg.products : [];
    if (msg.options && Array.isArray(msg.options.indexFields)) indexFields = msg.options.indexFields;
    return;
  }
  if (msg.type === 'QUERY') {
    const { id, q = '', filters = {}, page = 1, perPage = 20 } = msg;
    const needle = String(q).trim().toLowerCase();
    let results = index.filter(item => {
      let ok = true;
      // text match
      if (needle) {
        ok = indexFields.some(f => String(item[f]||'').toLowerCase().includes(needle));
      }
      // facet filters
      if (ok && filters) {
        for (const k in filters) {
          const val = filters[k]; if (val == null || val === '') continue;
          if (String(item[k]||'').toLowerCase() !== String(val).toLowerCase()) { ok = false; break; }
        }
      }
      return ok;
    });
    const total = results.length;
    const start = Math.max(0, (page-1)*perPage);
    results = results.slice(start, start+perPage);
    postMessage({ type: 'RESULT', id, total, items: results });
  }
};
