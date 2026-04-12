h28479
s 00059/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
// SharedWorker: Unified cart with IndexedDB persistence
let ports = [];
let cart = { items: [], updatedAt: Date.now(), version: 1 };
let db;

onconnect = function(e){
  const port = e.ports[0];
  ports.push(port);
  port.onmessage = async (evt) => {
    const msg = evt.data || {};
    if (msg.action === 'GET_CART') {
      await ensureDB(); await loadCart();
      port.postMessage({ event: 'CART', cart, version: cart.version });
    }
    if (msg.action === 'SET_CART') {
      cart = Object.assign({}, msg.cart || {}, { updatedAt: Date.now(), version: (cart.version||0)+1 });
      await ensureDB(); await saveCart();
      broadcast({ event: 'CART_UPDATED', cart, sourceId: msg.sourceId || null });
    }
  };
  port.start();
};

function broadcast(payload){ ports.forEach(p => { try { p.postMessage(payload); } catch(_){} }); }

function ensureDB(){
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open('shared-cart-db', 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
    };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode='readonly'){ return db.transaction(store, mode).objectStore(store); }

function loadCart(){
  return new Promise((resolve) => {
    try {
      const req = tx('kv').get('cart');
      req.onsuccess = () => { cart = req.result || cart; resolve(cart); };
      req.onerror = () => resolve(cart);
    } catch (_) { resolve(cart); }
  });
}

function saveCart(){
  return new Promise((resolve) => {
    try {
      const req = tx('kv','readwrite').put(cart,'cart');
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (_) { resolve(false); }
  });
}
E 1
