# Cart flow QA checklist (Batch 7)

Purpose: smoke-test add-to-cart, cart UI, PayPal checkout hooks, and localStorage clearing. Follow manual steps first; optional automated Playwright script is provided in `tests/playwright/`.

Manual checklist

- **Setup:** Start local server: `python -m http.server 8000` or run the provided `dev-httpd` task.
- **1) Add-to-cart (product page)**
  - Open a product page (e.g., `/pages/store/artisan-blends.html`).
  - Select any variant/options and click the `Add to Cart` button.
  - Expectation: cart UI updates (cart count, cart drawer or cart page shows added item) and localStorage contains `naturesi_cart` or similar key.

- **2) Cart page behaviour**
  - Open `/pages/cart.html`.
  - Verify item appears, quantities can be changed, totals update, and remove functions work.
  - Expectation: UI updates correctly, `aria-live` regions announce changes, no console errors.

- **3) Checkout page / PayPal hooks**
  - From cart, proceed to `/pages/checkout.html` or trigger PayPal flow.
  - Verify PayPal elements exist (`#paypal-button-container`) and redirect form values are populated when using redirect fallback.
  - Expectation: PayPal integration points present; do not attempt real payments in local environment (use sandbox credentials).

- **4) Payment success localStorage clearing**
  - Open `/pages/payment/success.html` after a simulated purchase.
  - Expectation: `naturesi_cart` and `naturesi-cart` keys removed from `localStorage` (check via browser devtools Application → Local Storage).

- **5) Edge cases & offline**
  - Test with JavaScript disabled: forms still present; ensure fallback copy is usable.
  - Test offline behaviour via `offline.html` and service worker flows (if relevant).

Automated smoke test (optional)

- A Playwright-based smoke test is included under `tests/playwright/cart.spec.js` to cover add-to-cart → cart → checkout basic flow. To run it locally:

```bash
npm init -y
npm i -D playwright @playwright/test
npx playwright install
npx playwright test tests/playwright/cart.spec.js
```

Notes & cautions

- Do not run payment transactions against live PayPal accounts. Use sandbox credentials or mock PayPal integrations when verifying flows.
- If you plan to refactor `cart-init.js`, add unit tests or run the Playwright smoke test after changes to confirm functional parity.

If you'd like, I can (A) patch `assets/js/modules/cart-init.js` to prefer `closest('article[data-sku]')` with fallbacks and run further checks, or (B) generate the Playwright test files now — tell me which.
