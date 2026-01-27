// SharedWorker: Product Catalog Cache (in-memory with optional IDB future)
let ports = [];
let catalog = null;

onconnect = function(e){
  const port = e.ports[0];
  ports.push(port);
  port.onmessage = async (evt) => {
    const msg = evt.data || {};
    if (msg.action === 'SET_CATALOG') { catalog = msg.data; broadcast({ event: 'CATALOG_READY' }); }
    if (msg.action === 'GET_CATALOG') { port.postMessage({ event: 'CATALOG', data: catalog }); }
  };
  port.start();
};

function broadcast(payload){ ports.forEach(p => { try { p.postMessage(payload); } catch(_){} }); }
