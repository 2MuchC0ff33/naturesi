// Development app.js with no caching and live reload helpers

// Only register service worker in production or secure contexts
if ('serviceWorker' in navigator && (window.location.hostname === 'localhost' || window.location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    // Clear all caches on page load for development
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(key => {
          caches.delete(key);
          console.log('Cleared cache:', key);
        });
      });
    }

    // Register the no-cache service worker
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
        registration.update();
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Development mode helpers
if (window.location.hostname === 'localhost') {
  // Force reload on focus for development
  window.addEventListener('focus', () => {
    console.log('Window focused - Development mode active');
    location.reload();
  });

  // Add timestamp to help identify fresh loads
  console.log('Page loaded at:', new Date().toISOString());
}
