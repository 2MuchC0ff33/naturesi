// Lightweight loader service worker that imports modular handlers.
// We can't use ES module imports without a build step, so we use importScripts.
// The modules under /assets/js/modules/ register event listeners when imported.

// Dynamically resolve the base path for importScripts to ensure portability.
// Use the directory portion of the pathname for robust base path resolution.
const basePath = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/') + 1);

try {
  importScripts(`${basePath}assets/js/modules/sw-core.js`);
  importScripts(`${basePath}assets/js/modules/sw-handlers.js`);
} catch (e) {
  console.error('Service Worker importScripts failed:', e);

  // Handle specific error cases
  if (e.name === 'NetworkError') {
    console.warn('Network error occurred while loading scripts. Falling back to offline handler.');
  } else if (e.name === 'SecurityError') {
    console.warn('Security error occurred. Ensure the scripts are served over HTTPS.');
  } else {
    console.warn('An unknown error occurred. Falling back to offline handler.');
  }

  // Fallback to a minimal offline handler
  self.addEventListener('fetch', (evt) => {
    if (evt.request.mode === 'navigate') {
      evt.respondWith(fetch(evt.request).catch(() => caches.match('/offline.html')));
    }
  });
}