h33124
s 00022/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
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
E 1
