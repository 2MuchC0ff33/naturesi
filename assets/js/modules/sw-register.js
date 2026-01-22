// Module: Service Worker registration helper
// Purpose: keep service-worker registration logic isolated so it can be maintained independently
export function registerServiceWorker() {
  // Only register service worker in production or secure contexts (preserve original guard)
  if (
    'serviceWorker' in navigator &&
    (window.location.hostname === 'localhost' || window.location.protocol === 'https:')
  ) {
    window.addEventListener('load', () => {
      // Clear all caches on page load for development (preserve original behaviour)
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            caches.delete(key);
            console.log('Cleared cache:', key);
          });
        });
      }

      // Register the no-cache service worker
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          registration.update();
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}
