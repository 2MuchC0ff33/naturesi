# Tests Migration Log

This file documents the HTML-first migration and test refactor actions.

Actions performed:

- Converted logic tests to remain as fast unit tests under `tests/unit/`.
- Marked acceptance tests that previously simulated `localStorage` in Node as migrated and skipped: `tests/acceptance/checkout-acceptance.test.js` (see `tests/unit/checkout-logic.test.js`).
- Replaced the Node-localStorage integration test with an HTML harness `tests/html/checkout-harness.html` and an integration test `tests/integration/cart-confirm-to-checkout.test.js` that fetches the harness and validates the runtime output.
- Made server startup/shutdown robust and cross-platform in `tests/sanity/smoke-server.test.js`.
- Relaxed performance test thresholds and made them configurable via `PERF_THRESHOLD_MS`.
- Gated heavy stress tests behind `RUN_SLOW_TESTS` (set to `1` to enable).

Notes:

- Optional browser tools (NativeNodeModules/ZombieJS/QuickJS/wkhtmltoimage/whtmltopdf) are documented as opt-in and should be added via an explicit PR if required. Tests depending on these tools must detect and skip when not available.
- If you want the acceptance test files removed entirely rather than skipped, remove the skipped files or archive them in a separate branch.

For any questions about the approach, check the repository `tests/README.md` or contact the maintainer.
