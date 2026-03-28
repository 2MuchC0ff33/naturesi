self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (ev) => {
	self.clients.claim();
});
self.addEventListener('fetch', () => {});
