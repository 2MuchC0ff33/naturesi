h21523
s 00121/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
// sw-handlers.js - fetch and sync handlers for the service worker
// Uses helpers exposed by sw-core.js
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Product data JSON (network-first, keep catalog fresh)
  try {
    if (url.origin === self.location.origin && (url.pathname === '/assets/js/data/products.json' || url.pathname === '/products.json')) {
      event.respondWith(self.__swHelpers.networkFirstWithTTL(req, API_CACHE, 5 * 60 * 1000));
      return;
    }
  } catch (e) { /* ignore */ }

  // Bypass PayPal and other cross-origin payment providers entirely
  if (!url.origin.startsWith(self.location.origin) && self.__swHelpers && self.__swHelpers.isPayPal(req.url)) return; // default network handling

  // Navigation requests: prefer preloadResponse (Navigation Preload API), then manual cache, then network-first
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const url = req.url;

      // 1. Check for browser-initiated preload (Navigation Preload API)
      try {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }
      } catch (e) { /* Ignore preload errors */ }

      // 2. Check for manually preloaded response in cache
      try {
        const cache = await caches.open('navigation-preloads');
        const cached = await cache.match(url);
        if (cached) {
          const preloadedAt = cached.headers.get('sw-preloaded-at');
          if (preloadedAt && (Date.now() - parseInt(preloadedAt, 10)) < 30000) {
            return cached;
          } else {
            await cache.delete(url);
          }
        }
      } catch (e) { /* Ignore cache errors */ }

      // 3. Fallback to network-first
      try {
        return await self.__swHelpers.networkFirstWithTTL(req, PAGE_CACHE, 0);
      } catch (err) {
        await self.__swHelpers.logError({ message: 'navigation-fetch-failed', url: req.url, meta: { error: String(err) } });
        return caches.match('/offline.html');
      }
    })());
    return;
  }

  // Static assets
  if (req.destination === 'style' || req.destination === 'script' || req.destination === 'font') {
    event.respondWith(self.__swHelpers.cacheFirst(req, STATIC_CACHE));
    return;
  }

  // Images: cache-first
  if (req.destination === 'image') {
    event.respondWith(self.__swHelpers.cacheFirst(req, IMAGE_CACHE));
    return;
  }

  // API JSON endpoints
  if (url.pathname.startsWith('/api/')) {
    const dynamic = /product-updates|inventory|prices/.test(url.pathname);
    event.respondWith(self.__swHelpers.networkFirstWithTTL(req, API_CACHE, dynamic ? 0 : 5 * 60 * 1000));
    return;
  }

  // Default fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).catch(async (err) => {
        try { await self.__swHelpers.logError({ message: 'fetch-failed', url: req.url, meta: { error: String(err) } }); } catch (_) { }
        throw err;
      });
    })
  );
});

// Background Sync: process queued orders when 'sync-orders' tag is fired
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil((async () => {
      const items = await self.__swHelpers.idbGetAll('order-queue');
      for (const it of items) {
        try {
          const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it.payload) });
          if (res && res.ok) await self.__swHelpers.idbDelete('order-queue', it.id);
          else {
            await self.__swHelpers.logError({ message: 'sync-order-failed', meta: { status: res && res.status }, url: '/api/orders', payload: it.payload });
          }
        } catch (err) { await self.__swHelpers.logError({ message: 'sync-order-network-error', url: '/api/orders', meta: { error: String(err), payload: it.payload } }); }
      }
    })());
  }
});

// Push notifications
self.addEventListener('push', (ev) => {
  let data = {};
  try { data = ev.data ? ev.data.json() : {}; } catch (e) { try { self.__swHelpers.logError({ message: 'push-parse-error', meta: { error: String(e) } }); } catch (_) { } }
  const title = data.title || 'Update';
  const options = { body: data.body || '', icon: '/assets/img/profile-placeholder-256x256.svg', data: data, actions: data.actions || [] };
  ev.waitUntil((async () => {
    try { await self.registration.showNotification(title, options); } catch (err) { try { await self.__swHelpers.logError({ message: 'push-notification-failed', meta: { error: String(err), payload: data } }); } catch (_) { } }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.openWindow(url));
});
E 1
