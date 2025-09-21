// Development service worker with no caching for immediate updates
// Improved: avoid noisy logs, bypass analytics/CDN internal endpoints, and provide sensible fallbacks.

const CACHE_NAME = 'nature-infusions-dev-nocache';

// Install event - skip caching entirely for development
self.addEventListener('install', event => {
  // Minimal install flow for dev
  self.skipWaiting();
});

// Activate event - clear all caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Utility to detect requests we should bypass (analytics, cloudflare internal, cross-origin)
function shouldBypassRequest(request) {
  try {
    const url = new URL(request.url);
    // Bypass requests to Cloudflare internal endpoints and common analytics static hosts
    if (url.pathname.startsWith('/cdn-cgi/') || url.hostname.includes('cloudflareinsights.com') || url.hostname.includes('cdn-cgi')) {
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
self.addEventListener('fetch', event => {
  const req = event.request;

  // Bypass analytics and cross-origin resources entirely to avoid interfering with vendor behaviour
  if (shouldBypassRequest(req)) {
    event.respondWith(
      fetch(req).catch(error => {
        // For navigation requests, try to deliver offline page if available
        if (req.mode === 'navigate') {
          return fetch('/offline.html', { cache: 'no-store' }).catch(() =>
            new Response('Offline - Network unavailable', { status: 503, statusText: 'Service Unavailable' })
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
    fetch(req, { cache: 'no-store' }).catch(error => {
      if (req.mode === 'navigate') {
        return fetch('/offline.html', { cache: 'no-store' }).catch(() =>
          new Response('Offline - Network unavailable', { status: 503, statusText: 'Service Unavailable' })
        );
      }
      return Promise.reject(error);
    })
  );
});
