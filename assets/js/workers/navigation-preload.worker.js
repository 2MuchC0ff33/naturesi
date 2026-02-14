// Navigation Preload Worker
// Manages navigation preloads with proper cancellation support
// Addresses preloadResponse cancellation issues by using AbortController

const activePreloads = new Map(); // url -> { controller, promise, timestamp, priority, id }
const MAX_CONCURRENT_PRELOADS = 3;
const PRELOAD_TIMEOUT = 10000; // 10 seconds
const CACHE_NAME = 'navigation-preloads';

self.onmessage = async (e) => {
  const { type, url, id, priority = 'normal' } = e.data;

  switch (type) {
    case 'PRELOAD':
      await handlePreload(url, id, priority);
      break;
    case 'CANCEL':
      handleCancel(url);
      break;
    case 'CLEANUP':
      handleCleanup();
      break;
  }
};

async function handlePreload(url, id, priority) {
  // Cancel existing preload for this URL
  handleCancel(url);

  // Limit concurrent preloads
  if (activePreloads.size >= MAX_CONCURRENT_PRELOADS) {
    const oldest = Array.from(activePreloads.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
    handleCancel(oldest[0]);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PRELOAD_TIMEOUT);

  const preloadPromise = fetch(url, {
    signal: controller.signal,
    credentials: 'same-origin',
    headers: { 'X-Preload': 'true' }
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Preload failed: ${response.status}`);

    // Cache the preloaded response
    const cache = await caches.open(CACHE_NAME);
    const responseClone = response.clone();
    const headers = new Headers(responseClone.headers);
    headers.set('sw-preloaded-at', Date.now().toString());
    headers.set('sw-preload-priority', priority);

    const cachedResponse = new Response(responseClone.body, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers
    });

    await cache.put(url, cachedResponse);

    self.postMessage({ type: 'PRELOAD_SUCCESS', url, id });
    return cachedResponse;
  }).catch((error) => {
    if (error.name === 'AbortError') {
      self.postMessage({ type: 'PRELOAD_CANCELLED', url, id });
    } else {
      self.postMessage({ type: 'PRELOAD_FAILED', url, id, error: error.message });
    }
    throw error;
  }).finally(() => {
    clearTimeout(timeoutId);
    activePreloads.delete(url);
  });

  activePreloads.set(url, {
    controller,
    promise: preloadPromise,
    timestamp: Date.now(),
    priority,
    id
  });
}

function handleCancel(url) {
  const preload = activePreloads.get(url);
  if (preload) {
    preload.controller.abort();
    activePreloads.delete(url);
  }
}

function handleCleanup() {
  // Cancel all active preloads
  for (const [url] of activePreloads) {
    handleCancel(url);
  }
  activePreloads.clear();
}
