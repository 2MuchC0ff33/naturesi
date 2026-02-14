
// sw-core.js - core constants and caching helpers for the service worker
// This file is intended to be loaded by importScripts from the root service worker.

// Cache version and names
const VERSION = 'v1.0.0';
const STATIC_CACHE = 'static-' + VERSION;
const PAGE_CACHE = 'pages-' + VERSION;
const API_CACHE = 'api-' + VERSION;
const IMAGE_CACHE = 'img-' + VERSION;

// Map to track active preloads for cancellation
const activePreloads = new Map(); // url -> AbortController

// Best-effort precache URLs; missing files are ignored during install via catch
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/css/main.css',
  '/assets/css/partials/README.md',
  '/assets/js/modules/worker-registry.js',
  '/assets/js/data/products.json',
  '/assets/img/profile-placeholder-256x256.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.all(PRECACHE_URLS.map(u => cache.add(u).catch(() => { })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![STATIC_CACHE, PAGE_CACHE, API_CACHE, IMAGE_CACHE].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();

    // Enable Navigation Preload API for browser-initiated preloads
    if ('navigationPreload' in self.registration) {
      await self.registration.navigationPreload.enable();
    }

    // Try to flush any queued telemetry on activation (best-effort, only when telemetry is enabled)
    try { if (await telemetryEnabled()) await telemetryFlush(); } catch (e) { }
  })());
});

function isPayPal(url) {
  try { const u = new URL(url); return /paypal\.com$/.test(u.hostname); } catch (e) { return false; }
}

// Function to handle on-demand navigation preloading in SW
async function preloadNavigation(url, id) {
  // Cancel any existing preload for this URL
  cancelPreload(url);

  const controller = new AbortController();
  activePreloads.set(url, controller);

  try {
    const response = await fetch(url, { signal: controller.signal, credentials: 'same-origin' });
    if (response.ok) {
      const cache = await caches.open('navigation-preloads');
      const headers = new Headers(response.headers);
      headers.set('sw-preloaded-at', Date.now().toString());
      const cachedResponse = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
      await cache.put(url, cachedResponse);
    }
  } catch (e) {
    // Ignore errors (e.g., aborted or network failure)
  } finally {
    activePreloads.delete(url);
  }
}

// Function to cancel an active preload
function cancelPreload(url) {
  const controller = activePreloads.get(url);
  if (controller) {
    controller.abort();
    activePreloads.delete(url);
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) {
    try { await cache.put(req, res.clone()); } catch (e) { /* swallow cache put errors */ }
  }
  return res;
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then(res => { if (res && res.ok) { try { cache.put(req, res.clone()); } catch (e) { } } return res; }).catch(() => cached);
  return cached || networkPromise;
}

async function networkFirstWithTTL(req, cacheName, ttlMs) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      try {
        const headers = new Headers(res.headers);
        headers.set('sw-cached-at', Date.now().toString());
        const withDate = new Response(res.clone().body, { headers });
        try { await cache.put(req, withDate.clone()); } catch (e) { /* swallow put errors */ }
        return withDate;
      } catch (e) {
        // If cloning/headers fails, fall back to returning the network response
        return res;
      }
    }
  } catch (_) { }
  if (cached) {
    const ts = Number(cached.headers.get('sw-cached-at') || '0');
    if (!ttlMs || (Date.now() - ts) < ttlMs) return cached;
  }
  return cached || fetch(req);
}

// Lightweight IDB helpers used by background sync and queues
let _db;
function idb() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open('sw-kv', 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('order-queue')) d.createObjectStore('order-queue', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('sw-errors')) d.createObjectStore('sw-errors', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('sw-meta')) d.createObjectStore('sw-meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(_db = req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGetAll(store) {
  try {
    const db = await idb();
    const out = [];
    const cur = db.transaction(store).objectStore(store).openCursor();
    return await new Promise((res) => { cur.onsuccess = () => { const c = cur.result; if (c) { const v = c.value; v.__key = c.key; out.push(v); c.continue(); } else res(out); }; setTimeout(() => res(out), 10000); });
  } catch (e) { return []; }
}
async function idbAdd(store, value) { try { const db = await idb(); return await new Promise(res => { const tx = db.transaction(store, 'readwrite'); const req = tx.objectStore(store).add(value); req.onsuccess = () => res({ ok: true, id: req.result }); req.onerror = () => res({ ok: false }); setTimeout(() => res({ ok: false }), 5000); }); } catch (e) { return { ok: false }; } }
async function idbClear(store) { try { const db = await idb(); return await new Promise(res => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).clear(); tx.oncomplete = () => res(true); setTimeout(() => res(false), 5000); }); } catch (e) { return false; } }
async function idbPutKey(store, key, value) { try { const db = await idb(); return await new Promise(res => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).put({ key: key, value: value }); tx.oncomplete = () => res(true); setTimeout(() => res(false), 5000); }); } catch (e) { return false; } }
async function idbGetKey(store, key) { try { const db = await idb(); return await new Promise(res => { const tx = db.transaction(store); const req = tx.objectStore(store).get(key); req.onsuccess = () => res(req.result && req.result.value); req.onerror = () => res(null); setTimeout(() => res(null), 5000); }); } catch (e) { return null; } }
async function idbDelete(store, key) { try { const db = await idb(); return await new Promise(res => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).delete(key); tx.oncomplete = () => res(true); setTimeout(() => res(false), 5000); }); } catch (e) { return false; } }

// Error logging & telemetry (opt-in)
async function telemetryEnabled() { try { const v = await idbGetKey('sw-meta', 'telemetryEnabled'); return !!v; } catch (e) { return false; } }
async function setTelemetryEnabled(enabled) { try { return await idbPutKey('sw-meta', 'telemetryEnabled', enabled ? true : false); } catch (e) { return false; } }
async function logError(entry) {
  try {
    const payload = Object.assign({ level: 'error', message: String(entry && entry.message || ''), url: entry && entry.url || '', stack: entry && entry.stack || '', ts: Date.now(), meta: entry && entry.meta || {} }, {});
    await idbAdd('sw-errors', payload);
    if (await telemetryEnabled()) {
      // try immediate flush but do not throw
      try { await telemetryFlush(); } catch (_) { }
    }
  } catch (e) { /* swallow errors */ }
}

async function telemetryFlush() {
  try {
    const items = await idbGetAll('sw-errors'); if (!items || !items.length) return true;
    // attempt to post to telemetry endpoint
    try {
      const res = await fetch('/api/sw-telemetry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errors: items, ts: Date.now() }) });
      if (res && res.ok) { await idbClear('sw-errors'); return true; }
    } catch (err) { /* network failed, leave queued */ }
    return false;
  } catch (e) { return false; }
}

// Expose helpers for handlers and telemetry
self.__swHelpers = Object.assign({}, { cacheFirst, staleWhileRevalidate, networkFirstWithTTL, isPayPal, idbGetAll, idbDelete, idbAdd, idbClear, idbGetKey, idbPutKey, logError, telemetryFlush, telemetryEnabled, setTelemetryEnabled });

// Accept messages from pages for queueing orders for background sync and telemetry control
self.addEventListener('message', (evt) => {
  const data = evt.data || {};
  if (!data || !data.type) return;
  if (data.type === 'QUEUE_ORDER') {
    (async () => {
      try {
        const db = await idb();
        const tx = db.transaction('order-queue', 'readwrite');
        tx.objectStore('order-queue').add({ payload: data.payload, queuedAt: Date.now() });
        tx.oncomplete = async () => {
          // attempt to register for sync if available
          try { const reg = await self.registration; if (reg && reg.sync) await reg.sync.register('sync-orders'); } catch (e) { }
        };
      } catch (e) { /* ignore */ }
    })();
  }
  if (data.type === 'SET_TELEMETRY') {
    setTelemetryEnabled(!!data.enabled).catch(() => { });
  }
  if (data.type === 'FLUSH_SW_ERRORS') {
    telemetryFlush().catch(() => { });
  }
  if (data.type === 'PRELOAD_NAVIGATION' && data.url) {
    preloadNavigation(data.url, data.id);
  }
  if (data.type === 'CANCEL_PRELOAD' && data.url) {
    cancelPreload(data.url);
  }
  // Allow pages to request a prefetch into the page cache
  if (data.type === 'PREFETCH_PAGE' && data.href) {
    (async () => {
      try {
        const url = new URL(String(data.href), self.location.origin).href;
        const cache = await caches.open(PAGE_CACHE);
        const res = await fetch(url, { credentials: 'same-origin' });
        if (res && res.ok) {
          try {
            const headers = new Headers(res.headers);
            headers.set('sw-cached-at', Date.now().toString());
            const withDate = new Response(res.clone().body, { headers });
            await cache.put(url, withDate.clone()).catch(() => { });
          } catch (e) { /* ignore clone/cache errors */ }
        }
      } catch (e) { /* best-effort prefetch failed */ }
    })();
  }
});

