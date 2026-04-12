h11309
s 00012/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
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
E 1
