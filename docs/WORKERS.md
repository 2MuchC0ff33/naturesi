# Worker Architecture Overview

This site follows an **HTML5-first**, **mobile-first**, **progressive enhancement** approach with **minimal JavaScript**. Heavy tasks are offloaded to Web Workers.

## Structure
- Dedicated Workers: `assets/js/workers/`
- Shared Workers: `assets/js/shared/`
- Service Worker: `/service-worker.js`
- Helpers: `assets/js/modules/`

## Messaging
All worker communication uses **JSON** via `postMessage`. See message contracts in code comments.

## Dedicated Workers
- `price-calculator.worker.js`: Calculates discounts, tax, shipping without blocking UI.
- `search-filter.worker.js`: Client-side search and multi-facet filtering.
- `image-processor.worker.js`: Optional image resizing/compression via `OffscreenCanvas`.
- `analytics-batch.worker.js`: Buffers events and flushes to backend.
- `csv-parser.worker.js`: Parses CSV with a simple parser.

## Shared Workers
- `shared-cart.shared-worker.js`: Cross-tab cart state, persisted via IndexedDB.
- `product-cache.shared-worker.js`: Cross-tab catalog cache.

## Service Worker
Implements versioned caches, `stale-while-revalidate` for pages, `cache-first` for static and images, API caching with TTL, background sync for offline orders, push notifications, and bypasses PayPal origins.

### Telemetry & Error reporting (opt-in)
The Service Worker includes an **opt-in** telemetry queue that records internal errors and operational failures (fetch errors, background-sync failures, push/notification issues) to IndexedDB under the `sw-errors` store. To protect privacy, telemetry is disabled by default; to enable it run on the page:

```js
// Enable telemetry and allow SW to batch-post to /api/sw-telemetry
if (window.SWClient && window.SWClient.setTelemetryEnabled) {
  window.SWClient.setTelemetryEnabled(true);
}
```

Manual flush of collected logs can be requested with:

```js
window.SWClient.flushSwErrors();
```

When enabled the SW attempts an immediate flush and will keep queued logs until a successful POST to `/api/sw-telemetry` is completed. If your deployment does not provide `/api/sw-telemetry` the SW will silently keep logs queued; ensure your backend implements this endpoint or consumes the `sw-errors` store via server-side tooling. This keeps reporting resilient across offline/spotty network conditions.

## PayPal Checkout (Mandatory Constraint)
- **Redirect-only** approach is preserved. No PayPal SDK is loaded.
- Service Worker bypasses `paypal.com` origins for navigation/fetch.
- Payment tokenization applies only to non-PayPal card flows.

## Add a New Worker
1. Create a file under `assets/js/workers/` or `assets/js/shared/`.
2. Define a small JSON protocol (`type`-based).
3. Register from the main thread via `WorkerRegistry` helpers.
4. Provide progressive enhancement fallbacks.

## Security & Privacy
- Do not embed secrets in client code. Keys must be provided at runtime.
- Use WebCrypto inside workers for sensitive operations where applicable.
- Respect user consent for analytics and push notifications. Provide opt-out.

## Accessibility
- Announce dynamic totals or updates with `aria-live` regions.
- Ensure keyboard navigation and form semantics work without JS.
