// Module: Service Worker registration helper
// Purpose: keep service-worker registration logic isolated so it can be maintained independently
export function registerServiceWorker() {
	// Only register service worker in production or secure contexts (preserve original guard)
	if (
		"serviceWorker" in navigator &&
		(window.location.hostname === "localhost" ||
			window.location.protocol === "https:")
	) {
		window.addEventListener("load", () => {
			// Register the service worker
			navigator.serviceWorker
				.register("/service-worker.js")
				.then((registration) => {
					console.log("Service Worker registered:", registration);

					// Check for cache clearing triggers on localhost
					const shouldClearCaches =
						window.location.hostname === "localhost" &&
						(window.location.search.includes("clear_cache=1") ||
							window.location.hash === "#clear-cache");

					if (shouldClearCaches && registration.active) {
						console.log("Clearing caches due to URL trigger...");
						registration.active.postMessage({ type: "CLEAR_CACHES" });
						// Reload after a short delay to ensure caches are cleared
						setTimeout(() => {
							window.location.reload();
						}, 500);
					}

					// Try to update but ignore failures (can happen in local setups with no HTTPS).
					if (registration && typeof registration.update === "function") {
						registration.update().catch((err) => {
							console.warn("Service Worker update (ignored) failed:", err);
						});
					}

					// Show update UI when a new service worker is installed and waiting.
					function showUpdateUI(reg) {
						if (!document || document.getElementById("sw-update-banner"))
							return;

						const banner = document.createElement("div");
						banner.id = "sw-update-banner";
						banner.className = "sw-update-banner";
						banner.setAttribute("role", "status");
						banner.setAttribute("aria-live", "polite");
						banner.innerHTML = `
              <div class="sw-update-content">
                <p class="sw-update-message">A new version is available.</p>
                <div class="sw-update-actions">
                  <button class="sw-update-button">Refresh</button>
                  <button class="sw-update-dismiss" aria-label="Dismiss update">Dismiss</button>
                </div>
              </div>
            `;

						document.body.appendChild(banner);

						const refreshBtn = banner.querySelector(".sw-update-button");
						const dismissBtn = banner.querySelector(".sw-update-dismiss");

						refreshBtn.addEventListener("click", () => {
							// Tell the waiting service worker to skipWaiting
							if (reg.waiting) {
								reg.waiting.postMessage({ type: "SKIP_WAITING" });
							}
						});

						dismissBtn.addEventListener("click", () => {
							banner.remove();
						});

						// When the new service worker takes control, reload to activate it
						navigator.serviceWorker.addEventListener("controllerchange", () => {
							window.location.reload();
						});
					}

					// If there's an already-waiting SW, prompt user immediately
					if (registration.waiting) {
						showUpdateUI(registration);
						return;
					}

					// Listen for updates being found
					registration.addEventListener("updatefound", () => {
						const newWorker = registration.installing;
						if (!newWorker) return;
						newWorker.addEventListener("statechange", () => {
							if (newWorker.state === "installed") {
								// Only show the update UI if there is an existing controller (i.e., page is controlled)
								if (navigator.serviceWorker.controller) {
									showUpdateUI(registration);
								} else {
									// First install — no action required.
									console.log("Service worker installed for the first time.");
								}
							}
						});
					});
				})
				.catch((error) => {
					console.log("Service Worker registration failed:", error);
				});
		});
	}
}
