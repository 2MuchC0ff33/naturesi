// Development service worker with no caching for immediate updates

const CACHE_NAME = 'nature-infusions-dev-nocache';

// Install event - skip caching entirely for development
self.addEventListener('install', event => {
  console.log('Service Worker: Install (No Caching Mode)');
  self.skipWaiting();
});

// Activate event - clear all caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activate (Clearing All Caches)');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch event - always fetch from network, never cache
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetch (Network Only)', event.request.url);
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store' // Force no caching
    }).catch(error => {
      console.error('Service Worker: Network fetch failed', error);
      // Only show offline page for navigation requests
      if (event.request.mode === 'navigate') {
        return fetch('/offline.html', { cache: 'no-store' }).catch(() => {
          return new Response('Offline - Network unavailable', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      }
      // For other resources, just fail
      throw error;
    })
  );
});
