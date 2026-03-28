// SW client helper: order queueing, telemetry and SW error flushing
// Note: SW registration is handled by sw-register.js — do not duplicate here.
export async function queueOrder(payload) {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg && reg.active && reg.active.postMessage) {
    try { reg.active.postMessage({ type: 'QUEUE_ORDER', payload }); } catch(_){ }
  }
  if (reg && 'sync' in reg) {
    try { await reg.sync.register('sync-orders'); } catch(_){ }
  }
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch(_){ /* offline — SW handles queueing */ }
}

export async function setTelemetryEnabled(enabled) {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.active && reg.active.postMessage) {
      reg.active.postMessage({ type: 'SET_TELEMETRY', enabled: !!enabled });
    }
  } catch (e) { console.warn('setTelemetryEnabled failed', e); }
}

export async function flushSwErrors() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.active && reg.active.postMessage) {
      reg.active.postMessage({ type: 'FLUSH_SW_ERRORS' });
    }
  } catch (e) { console.warn('flushSwErrors failed', e); }
}

if (typeof window !== 'undefined' && !window.SWClient) {
  window.SWClient = { queueOrder, setTelemetryEnabled, flushSwErrors };
}
