// Minimal worker registry and feature detection (no build step)
(function(){
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
