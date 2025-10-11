// Development service worker with no caching for immediate updates
// Improved: avoid noisy logs, bypass analytics/CDN internal endpoints, and provide sensible fallbacks.

// Install event - skip caching entirely for development
self.addEventListener('install', () => {
  // Minimal install flow for dev
  self.skipWaiting();
  // Pre-cache minimal cart assets to enable offline cart UX
  if (self.caches) {
    const preCache = async () => {
      const cache = await caches.open('naturesi-static-v1');
      return cache.addAll([
        '/assets/css/main.css',
        '/assets/js/app.js',
        '/pages/cart.html',
        '/offline.html'
      ].filter(Boolean));
    };
    event && event.waitUntil ? event.waitUntil(preCache()) : preCache();
  }
});

// Activate event - clear all caches
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  self.clients.claim();
});

// Utility to detect requests we should bypass (analytics, cloudflare internal, cross-origin)
function shouldBypassRequest(request) {
  try {
    const url = new URL(request.url);
    // Bypass requests to Cloudflare internal endpoints and common analytics static hosts
    if (url.pathname.startsWith('/cdn-cgi/') || url.hostname.includes('cloudflareinsights.com')) {
      return true;
    }
    // Bypass cross-origin requests (let browser/network handle them)
    if (url.origin !== self.location.origin) return true;
  } catch (e) {
    // If URL parsing fails, don't block - fallback to network
    return true;
  }
  return false;
}

// Fetch event - network only for same-origin, bypass for analytics/third-party
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Bypass analytics and cross-origin resources entirely to avoid interfering with vendor behaviour
  if (shouldBypassRequest(req)) {
    event.respondWith(
      fetch(req).catch((error) => {
        // For navigation requests, try to deliver offline page if available
        if (req.mode === 'navigate') {
          return fetch('/offline.html', { cache: 'no-store' }).catch(
            () =>
              new Response('Offline - Network unavailable', {
                status: 503,
                statusText: 'Service Unavailable',
              })
          );
        }
        // Let the failure bubble for other resources so the page can handle it
        return Promise.reject(error);
      })
    );
    return;
  }

  // For same-origin requests, do a network-only fetch with no-store (development behaviour).
  // Catch network errors for navigations and provide offline fallback.
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((res) => {
        // Optionally cache GET navigation responses for offline viewing
        try {
          if (req.method === 'GET' && req.destination !== 'document') return res;
          if (res && res.ok && req.mode === 'navigate') {
            const copy = res.clone();
            caches.open('naturesi-static-v1').then((cache) => cache.put(req, copy));
          }
        } catch (e) { /* ignore caching errors */ }
        return res;
      })
      .catch((error) => {
        if (req.mode === 'navigate') {
          return caches.match('/pages/cart.html').then((cached) => cached || fetch('/offline.html').catch(() => new Response('Offline - Network unavailable', { status: 503 })));
        }
        return Promise.reject(error);
      })
  );
});

// Background sync: attempt to POST pending cart updates to /sync-cart (best-effort)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open('naturesi-static-v1');
          const req = new Request('/sync-cart', { method: 'POST' });
          // Attempt a fetch to trigger server-side sync; if server unavailable, it will be retried
          await fetch(req).catch(() => Promise.resolve());
        } catch (e) {
          // swallow errors - sync will retry later if supported
        }
      })()
    );
  }
});
