h19933
s 00030/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
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
E 1
