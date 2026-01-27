// SW client helper: registration and order queueing
export async function register(){
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.register('/service-worker.js'); } catch (e) { console.warn('SW registration failed', e); return null; }
}

export async function queueOrder(payload){
  // Post a message to SW to queue order or attempt Background Sync
  const reg = await navigator.serviceWorker.getRegistration();
  // If SW present, send the payload to the SW so it can persist it to IndexedDB and register sync
  if (reg && reg.active && reg.active.postMessage) {
    try { reg.active.postMessage({ type: 'QUEUE_ORDER', payload }); } catch(_){ }
  }
  if (reg && 'sync' in reg) {
    try { await reg.sync.register('sync-orders'); } catch(_){ }
  }
  // Fire and forget to API; SW will handle offline scenario
  try { await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); } catch(_){ /* offline */ }
}

export async function setTelemetryEnabled(enabled){
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.active && reg.active.postMessage) reg.active.postMessage({ type: 'SET_TELEMETRY', enabled: !!enabled });
  } catch (e) { console.warn('setTelemetryEnabled failed', e); }
}

export async function flushSwErrors(){
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.active && reg.active.postMessage) reg.active.postMessage({ type: 'FLUSH_SW_ERRORS' });
  } catch (e) { console.warn('flushSwErrors failed', e); }
}

// Expose as global convenience (progressive enhancement)
if (typeof window !== 'undefined' && !window.SWClient) window.SWClient = { register, queueOrder, setTelemetryEnabled, flushSwErrors };
