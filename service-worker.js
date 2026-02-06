// Minimal service worker for PWA basics
// Install event: cache offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-v1').then((cache) => {
      return cache.add('/offline.html');
    })
  );
});

// Activate event: claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event: serve offline page for navigation requests when offline
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
