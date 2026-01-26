// sw-handlers.js - fetch and sync handlers for the service worker
// Assumes sw-core.js has been importScripts'd first and defines CACHE_NAME
// fetch handler - cache-first for static assets, network-first for HTML
self.addEventListener('fetch', function (evt) {
  const req = evt.request;
  // Only handle GET requests
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isPaymentPath = url.pathname.startsWith('/pages/payment') || url.pathname.includes('/payment');
  const hasSearch = !!url.search;

  // HTML navigations: network-first but avoid caching payment pages or
  // navigations that include search params (could contain provider tokens).
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    evt.respondWith(
      fetch(req)
        .then((res) => {
          // Only cache successful, same-origin, non-payment, no-query responses
          try {
            if (
              res &&
              res.ok &&
              new URL(req.url).origin === self.location.origin &&
              !isPaymentPath &&
              !hasSearch
            ) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then(function (c) {
                c.put(req, copy).catch(function () {});
              });
            }
          } catch (e) {}
          return res;
        })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // cache-first for other static assets: only cache same-origin, ok responses
  evt.respondWith(
    caches.match(req).then(function (cachedResponse) {
      if (cachedResponse) return cachedResponse;
      return fetch(req).then(function (networkResponse) {
        try {
          if (
            networkResponse &&
            networkResponse.ok &&
            new URL(req.url).origin === self.location.origin &&
            !isPaymentPath
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(req, responseClone).catch(function () {});
            });
          }
        } catch (e) {}
        return networkResponse;
      });
    })
  );
});

// sync handler example for 'sync-cart' tag
self.addEventListener('sync', function (evt) {
  if (evt.tag === 'sync-cart') {
    evt.waitUntil(
      (async function () {
        try {
          const all = await self.clients.matchAll({ includeUncontrolled: true });
          for (const client of all) {
            client.postMessage({ type: 'sync-cart' });
          }
        } catch (e) {}
      })()
    );
  }
});
