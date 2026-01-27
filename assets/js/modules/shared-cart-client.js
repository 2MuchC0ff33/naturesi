// Client adapter for shared-cart.shared-worker.js
export function createClient(){
  const supports = (window.WorkerRegistry && window.WorkerRegistry.supports && window.WorkerRegistry.supports.sharedWorker);
  if (!supports) return null;
  try {
    const sw = window.WorkerRegistry.createSharedWorker('/assets/js/shared/shared-cart.shared-worker.js', 'shared-cart');
    const port = sw && sw.port;
    if (!port) return null;
    port.start();
    const listeners = new Set();
    port.onmessage = (e) => { listeners.forEach(fn => fn(e.data)); };
    return {
      on: (fn) => { listeners.add(fn); },
      off: (fn) => { listeners.delete(fn); },
      getCart: () => port.postMessage({ action: 'GET_CART' }),
      setCart: (cart, sourceId) => port.postMessage({ action: 'SET_CART', cart, sourceId })
    };
  } catch (e) { console.warn('Shared cart unavailable', e); return null; }
}

// Also expose to global for non-bundled consumers
if (typeof window !== 'undefined' && !window.SharedCartClient) window.SharedCartClient = { createClient };
