// Module: Service Worker registration helper
// Purpose: keep service-worker registration logic isolated so it can be maintained independently
export function registerServiceWorker() {
  // Only register service worker in production or secure contexts (preserve original guard)
  if (
    'serviceWorker' in navigator &&
    (window.location.hostname === 'localhost' || window.location.protocol === 'https:')
  ) {
    window.addEventListener('load', () => {
        // Clear caches only in explicit dev contexts:
      // - localhost, or use ?clear_cache=1 or add #clear-cache to the URL
      if (
        'caches' in window &&
        (window.location.hostname === 'localhost' ||
          /[?&]clear_cache=1/.test(window.location.search) ||
          /#clear-cache/.test(window.location.hash))
      ) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            caches.delete(key).then((ok) => {
              if (ok) console.log('Cleared cache:', key);
            });
          });
        });
      }

      // Register the no-cache service worker
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);

          // Try to update but ignore failures (can happen in local setups with no HTTPS).
          if (registration && typeof registration.update === 'function') {
            registration.update().catch(function (err) {
              console.warn('Service Worker update (ignored) failed:', err);
            });
          }

          // Show update UI when a new service worker is installed and waiting.
          function showUpdateUI(reg) {
            if (!document || document.getElementById('sw-update-banner')) return;

            const banner = document.createElement('div');
            banner.id = 'sw-update-banner';
            banner.className = 'sw-update-banner';
            banner.setAttribute('role', 'status');
            banner.setAttribute('aria-live', 'polite');
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

            const refreshBtn = banner.querySelector('.sw-update-button');
            const dismissBtn = banner.querySelector('.sw-update-dismiss');

            refreshBtn.addEventListener('click', function () {
              // Tell the waiting service worker to skipWaiting
              if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
            });

            dismissBtn.addEventListener('click', function () {
              banner.remove();
            });

            // When the new service worker takes control, reload to activate it
            navigator.serviceWorker.addEventListener('controllerchange', function () {
              window.location.reload();
            });
          }

          // If there's an already-waiting SW, prompt user immediately
          if (registration.waiting) {
            showUpdateUI(registration);
            return;
          }

          // Listen for updates being found
          registration.addEventListener('updatefound', function () {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', function () {
              if (newWorker.state === 'installed') {
                // Only show the update UI if there is an existing controller (i.e., page is controlled)
                if (navigator.serviceWorker.controller) {
                  showUpdateUI(registration);
                } else {
                  // First install — no action required.
                  console.log('Service worker installed for the first time.');
                }
              }
            });
          });
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}
