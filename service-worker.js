// Lightweight loader service worker that imports modular handlers.
// We can't use ES module imports without a build step, so we use importScripts.
// The modules under /assets/js/modules/ register event listeners when imported.

try {
  importScripts('/assets/js/modules/sw-core.js');
  importScripts('/assets/js/modules/sw-handlers.js');
} catch (e) {
  // If importScripts fails, fallback to a minimal offline handler
  self.addEventListener('fetch', (evt) => {
    if (evt.request.mode === 'navigate') {
      evt.respondWith(fetch(evt.request).catch(() => caches.match('/offline.html')));
    }
  });
}
