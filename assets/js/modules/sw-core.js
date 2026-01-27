// sw-core.js - core constants and caching helpers for the service worker
// This file is intended to be loaded by importScripts from the root service worker.
var CACHE_NAME = 'naturesi-static-v1';
var PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/assets/css/main.css',
  '/pages/cart.html',
  '/pages/checkout.html',
  '/pages/shipping-estimate.html',
  '/assets/img/hero-home-1600x900.webp',
  '/assets/img/hero-home-1600x900.jpg',
  '/assets/img/hero-home-1200x675.webp',
  '/assets/img/hero-home-1200x675.jpg',
  '/assets/img/hero-home-800x450.webp',
  '/assets/img/hero-home-800x450.jpg',
  '/assets/js/data/products.json',
  '/assets/img/profile-placeholder-256x256.svg',
  // NOTE: payment success/fail pages are intentionally NOT precached.
  // These pages can include transient data or query params from payment
  // providers; caching them can cause stale or sensitive content to be served.
];

self.addEventListener('install', function (evt) {
  // Do not skipWaiting here; allow the new worker to enter a 'waiting' state
  // so the page can prompt the user before activating the update.
  evt.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // Attempt to fetch and cache each URL individually so one bad URL won't abort the install.
      return Promise.all(
        PRECACHE_URLS.map(function (url) {
          return fetch(url, { credentials: 'same-origin' })
            .then(function (response) {
              if (!response.ok) throw new Error(url + ' returned ' + response.status);
              return cache.put(url, response.clone()).then(function () {
                console.log('Precached:', url);
                return true;
              });
            })
            .catch(function (err) {
              // Log and continue; this prevents a single 404 from failing the whole install.
              console.warn('Precache failed for', url, err);
              return null;
            });
        })
      );
    })
  );
});

// Respond to messages from the page (for example, trigger a skipWaiting)
self.addEventListener('message', function (evt) {
  if (!evt.data) return;
  if (evt.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', function (evt) {
  evt.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE_NAME) return caches.delete(k);
          return null;
        })
      );
    })
  );
  self.clients.claim();
});
