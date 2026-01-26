# Initial Findings — JS Module Inventory (batch 1)

**Scanned modules:** 18 (all files under `assets/js/modules/`)

## Key observations ✅

- Auto-run modules identified: `sw-core.js`, `sw-handlers.js` (service-worker), `checkout-bootstrap.js` (IIFE), `category-select.js` (auto-init), and `cart.js` (auto-run `attachFormHandler`). These are intentional but should be tracked when changing load order or moving inline scripts to modules.
- Targeted selectors and attributes are concentrated around a few subsystems: navigation (`nav-toggle.js`), modals (`modal.js`), cart/checkout (`cart*.js`, `checkout.js`), and service worker scripts. These are high-impact areas for selector/ITCSS modernisation.
- Legacy or noteworthy patterns:
  - `sw-core.js` uses `var CACHE_NAME` and the classic importScripts/service worker pattern (not an ES module) — treat SW files as a separate compatibility surface.
  - A few small timing anti-patterns: `setTimeout(..., 50)` used for focus movement (nav/modal), and small delays for auto-submit in `checkout.js`/`checkout-bootstrap.js`.
  - IndexedDB code uses event callbacks (onsuccess/onerror) — works fine but could be modernised to Promises/async wrappers if desired.
- Data attribute footprint: standard attributes used across modules include `data-price`, `data-product-size`, `data-sku`, `data-id`, `data-modal-target`, `data-modal-close` and the custom `categorySelectInit` dataset flag. These should be kept stable across template changes.

## Potential risks / follow-ups ⚠️

- Duplicate or overlapping document-level listeners (delegated `submit` and `click` handlers) exist across cart-related modules (`cart-init.js`, `cart.js`). They use reliable guards but will need careful testing when refactoring event delegation.
- PayPal-related flows rely on `paypal.json` for configuration + redirect form (`paypal-redirect-form`) and may require careful end-to-end QA after selector or form changes.
- Changing or renaming localStorage keys (`naturesi_cart`, `naturesi-cart`) or data attributes may silently break restore/checkout flows. Add tests and search/replace across codebase if renaming.

## Next recommended actions (aligns with micro-batches)

1. Run the HTML Template Inventory (batch 2) and cross-reference selectors against `analysis/selector_reference.json` to identify dead selectors or mismatches.
2. Consolidate the JS–HTML reference map (batch 3) and flag selectors with no matching HTML as candidates for cleanup.
3. Prioritise safe selector modernisation for navigation and modals (batches 4 & 5) since they are small, high-value changes.

---

Files produced:
- `analysis/module_inventory.json` — exports/imports/auto-run/legacy notes per module
- `analysis/selector_reference.json` — module -> selectors + data attributes
- `analysis/initial_findings.md` — this summary

If you want, I can now run Batch 2 (HTML Template Inventory) to extract classes/IDs and inline scripts and cross-reference them with this selector list. 💡
