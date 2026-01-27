// Lightweight analytics wiring using analytics-batch.worker.js
export function initAnalytics() {
  const w = (window.WorkerRegistry && window.WorkerRegistry.createWorker('/assets/js/workers/analytics-batch.worker.js')) || null;
  function track(evtType, payload){ if (w) w.postMessage({ type:'EVENT', evtType, payload, time: Date.now() }); }
  document.addEventListener('click', (e)=>{ const t = e.target && e.target.closest && e.target.closest('[data-track]'); if (t) track('click', { id: t.getAttribute('data-track'), tag: t.tagName }); });
  return { track, flush: ()=> w && w.postMessage({ type:'FLUSH' }) };
}

// Auto-init if module loaded in browser
if (typeof document !== 'undefined') {
  try { const a = initAnalytics(); window.Analytics = a; } catch (e) { }
}
