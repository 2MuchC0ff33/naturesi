// Advanced service worker with modular architecture for full PWA capabilities
// Imports core helpers and event handlers for precaching, advanced caching, background sync, push notifications, telemetry, and error handling
importScripts('/assets/js/modules/sw-core.js', '/assets/js/modules/sw-handlers.js');

// Additional message handler for development cache clearing (preserved from minimal version)
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
