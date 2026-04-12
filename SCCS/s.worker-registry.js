h24814
s 00026/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
// Minimal worker registry and feature detection (no build step)
(()=> {
  const supports = {
    worker: typeof Worker !== 'undefined',
    sharedWorker: typeof SharedWorker !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    idb: 'indexedDB' in self
  };
  if (!window.WORKERS_AVAILABLE) window.WORKERS_AVAILABLE = supports;

  function createWorker(url, options) {
    if (!supports.worker) return null;
    try { return new Worker(url, Object.assign({ type: 'module' }, options || {})); } catch (_) {
      try { return new Worker(url); } catch (e) { console.warn('Worker failed', e); return null; }
    }
  }

  function createSharedWorker(url, name) {
    if (!supports.sharedWorker) return null;
    try { return new SharedWorker(url, { name: name || undefined }); } catch (e) {
      console.warn('SharedWorker failed', e); return null;
    }
  }

  window.WorkerRegistry = { createWorker, createSharedWorker, supports };
})();
E 1
