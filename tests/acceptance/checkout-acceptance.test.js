import test from 'node:test';

// MIGRATION NOTE:
// This acceptance test relied on Node-based localStorage simulation. The
// functionality has been migrated to fast unit tests (see
// `tests/unit/checkout-logic.test.js`) and an HTML harness for runtime flows
// (`tests/html/checkout-harness.html`). To avoid surprising failures in CI
// while preserving history, this file is intentionally skipped.

test.skip('migrated: acceptance/checkout tests moved to unit and harness-based tests', () => {
  // intentionally skipped; see tests/unit/checkout-logic.test.js and tests/html/
});
