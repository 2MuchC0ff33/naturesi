// sw-core.js - core constants and caching helpers for the service worker
// This file is intended to be loaded by importScripts from the root service worker.
var CACHE_NAME = 'naturesi-static-v1';
var PRECACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/assets/css/main.css'
];

self.addEventListener('install', function (evt) {
    self.skipWaiting();
    evt.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(PRECACHE_URLS); })
    );
});

self.addEventListener('activate', function (evt) {
    evt.waitUntil(
        caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { if (k !== CACHE_NAME) return caches.delete(k); return null; })); })
    );
    self.clients.claim();
});
