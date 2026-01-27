// Dedicated Worker: Analytics batch & flush
let queue = [];
let flushTimer = null;

self.onmessage = (e) => {
  const msg = e.data || {};
  if (msg.type === 'EVENT') {
    queue.push({ evtType: msg.evtType, payload: msg.payload, time: msg.time || Date.now() });
    scheduleFlush();
    postMessage({ type: 'ACK', status: 'QUEUED' });
  }
  if (msg.type === 'FLUSH') {
    flushNow();
  }
};

function scheduleFlush(){ if (flushTimer) return; flushTimer = setTimeout(flushNow, 5000); }

async function flushNow(){
  clearTimeout(flushTimer); flushTimer = null;
  const batch = queue.splice(0, queue.length);
  if (!batch.length) return;
  try {
    await fetch('/api/analytics', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ events: batch }) });
    postMessage({ type: 'ACK', status: 'FLUSHED' });
  } catch (_) {
    // Requeue on failure
    queue = batch.concat(queue);
  }
}
