// Minimal service worker for PWA basics
// Install event: cache offline page
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open("offline-v1").then((cache) => {
			return cache.add("/offline.html");
		}),
	);
});

// Message event: handle cache clearing for development
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "CLEAR_CACHES") {
		caches
			.keys()
			.then((keys) => {
				return Promise.all(keys.map((key) => caches.delete(key)));
			})
			.then(() => {
				console.log("All caches cleared successfully");
			})
			.catch((err) => {
				console.error("Failed to clear caches:", err);
			});
	}
});

// Activate event: claim clients
self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

// Fetch event: serve offline page for navigation requests when offline
self.addEventListener("fetch", (event) => {
	if (event.request.mode === "navigate") {
		event.respondWith(
			fetch(event.request).catch(() => {
				return caches.match("/offline.html");
			}),
		);
	}
});
