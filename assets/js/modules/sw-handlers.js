// sw-handlers.js - fetch and sync handlers for the service worker
// Assumes sw-core.js has been importScripts'd first and defines CACHE_NAME
// fetch handler - cache-first for static assets, network-first for HTML
self.addEventListener('fetch', function (evt) {
    const req = evt.request;
    if (req.method !== 'GET') return;
    if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
        // network-first
        evt.respondWith(
            fetch(req).then((res) => {
                const copy = res.clone();
                try { caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); }); } catch (e) { }
                return res;
            }).catch(() => caches.match('/offline.html'))
        );
        return;
    }

    // cache-first for other assets
    evt.respondWith(
        caches.match(req).then(function (cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }
            // Not in cache, fetch from network
            return fetch(req).then(function (networkResponse) {
                // Clone response before caching
                const responseClone = networkResponse.clone();
                // Attempt to cache the response
                try {
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(req, responseClone);
                    });
                } catch (e) {
                    // Ignore caching errors
                }
                return networkResponse;
            });
        })
    );
});

// sync handler example for 'sync-cart' tag
self.addEventListener('sync', function (evt) {
    if (evt.tag === 'sync-cart') {
        evt.waitUntil((async function () {
            try {
                var all = await self.clients.matchAll({ includeUncontrolled: true });
                for (var i = 0; i < all.length; i++) { all[i].postMessage({ type: 'sync-cart' }); }
            } catch (e) { }
        })());
    }
});
