## TODO: Minimal PayPal Redirect Checkout — HTML‑First, Minimal JS

_Last updated: 2026-01-21_

Summary

- Goal: Add the simplest possible PayPal redirect checkout (aggregate amount) that redirects customers to PayPal and returns them to:
  - success: `/pages/payment/success.html`
  - cancel/fail: `/pages/payment/fail.html`
- Philosophy: **HTML5 first → CSS next → native Web APIs → JSON config → JavaScript only when necessary**. No inline JS/CSS.

Scope (MVP)

- Redirect-only flow (no server endpoints, no PayPal JS SDK).
- Client computes an aggregate total, posts a single PayPal form (`cmd=_xclick`) to PayPal sandbox or live.
- Keep configuration in `assets/js/data/paypal.json` (placeholders — replaced at build/deploy time for production).

Files to add / modify

- Create:
  - `assets/js/data/paypal.json` (config template, placeholders)
  - `assets/js/modules/cart.js` (collect canonical cart, write `localStorage`)
  - `assets/js/modules/checkout.js` (render summary, populate PayPal form)
  - `pages/checkout.html` (order summary + `#paypal-form`)
  - `pages/payment/success.html` (minimal confirmation page)
  - `pages/payment/fail.html` (minimal cancel page)
  - `assets/css/partials/checkout.css` (mobile-first styles)
  - `.github/PAYPAL_INTEGRATION.md` (short instructions + CI note)
- Modify:
  - `pages/cart.html` — add confirm/submit form/button (no inline JS)
  - `assets/js/app.js` — conditionally import modules when DOM markers exist
  - `assets/css/main.css` — import the new partial

Canonical cart contract (localStorage)

- Key: `naturesi_cart`
- Type: JSON array of objects
- Item schema:
  - `id`: string
  - `title`: string
  - `price`: number (per-unit)
  - `qty`: integer
- Example:

```json
[{ "id": "sku-100", "title": "Chamomile Infusion 50g", "price": 9.95, "qty": 2 }]
```

- Shipping option: either include a shipping line item (`id: 'shipping'`) or store meta in `naturesi_cart_meta` — pick one and document it.

Config template (`assets/js/data/paypal.json`)

```json
{
  "env": "sandbox",
  "business": "sandbox-business@example.com",
  "currency": "AUD",
  "sandbox_url": "https://www.sandbox.paypal.com/cgi-bin/webscr",
  "live_url": "https://www.paypal.com/cgi-bin/webscr",
  "return_path": "/pages/payment/success.html",
  "cancel_path": "/pages/payment/fail.html",
  "sdk_enabled": false
}
```

- **Do not commit live secrets**. Replace placeholders at build time using CI or host env vars.

HTML snippets (no inline JS/CSS)

- Cart proceed button (add to `pages/cart.html`):

```html
<form
  id="confirm-cart-form"
  aria-label="Confirm items and proceed to checkout"
  action="/pages/checkout.html"
  method="get"
>
  <button type="submit" id="btn-proceed-checkout" class="btn btn-primary">
    Proceed to checkout
  </button>
</form>
```

- Checkout PayPal redirect form (`pages/checkout.html`):

```html
<form
  id="paypal-form"
  method="post"
  action="https://www.sandbox.paypal.com/cgi-bin/webscr"
  novalidate
>
  <input type="hidden" name="cmd" value="_xclick" />
  <input type="hidden" name="business" id="pp-business" value="" />
  <input type="hidden" name="item_name" id="pp-item_name" value="" />
  <input type="hidden" name="amount" id="pp-amount" value="" />
  <input type="hidden" name="currency_code" id="pp-currency" value="AUD" />
  <input type="hidden" name="return" id="pp-return" value="/pages/payment/success.html" />
  <input type="hidden" name="cancel_return" id="pp-cancel" value="/pages/payment/fail.html" />
  <button type="submit" id="pay-now" class="btn btn-primary">Pay with PayPal</button>
</form>
```

- Add an explanatory paragraph about redirection and a `<noscript>` fallback.

JavaScript responsibilities (minimal, defensive)

- `assets/js/modules/cart.js`:
  - On submit: collect cart from global JS or DOM, normalize items to canonical schema, store in `localStorage.naturesi_cart`, and navigate to `/pages/checkout.html`.
- `assets/js/modules/checkout.js`:
  - Fetch `/assets/js/data/paypal.json` (cache: no-store).
  - Read and validate `localStorage.naturesi_cart`.
  - Render accessible itemised summary in `#summary-content` using `textContent` and DOM APIs.
  - Compute grand total (numeric) and populate hidden form inputs (`business`, `item_name`, `amount`, `currency_code`, `return`, `cancel_return`).
  - Set form `action` to sandbox or live URL based on `env` in config.
  - If cart empty or `business` missing: show error and disable submit.
- Keep modules small, import conditionally from `assets/js/app.js` only when relevant DOM markers exist.

CSS

- Add `assets/css/partials/checkout.css` (mobile-first, accessible contrast, focus states).
- Import into `assets/css/main.css`.

QA / Acceptance Criteria

- `pages/cart.html` writes valid JSON to `localStorage.naturesi_cart` (numeric `price`, integer `qty`).
- `pages/checkout.html` displays line items and grand total correctly.
- Hidden PayPal form fields populated; `form.action` points to sandbox when `env: sandbox`.
- Clicking "Pay with PayPal" redirects to PayPal and shows the correct total; sandbox completes to success page and cancel returns to fail page.
- If cart empty or `business` missing: clear UI message and disabled submit.

Security note (production)

- Client-side totals can be tampered with — acceptable for sandbox/demo. For production **implement server-assisted order creation and webhook verification** before fulfilling orders.
- Never commit `client_secret` or other live secrets. Use CI or host environment variables for injection.

CI / Deployment notes

- Build-time injection example: use a small Node script or `jq` in GitHub Actions / Netlify / Vercel to replace placeholders in `assets/js/data/paypal.json` with `env=live`, `business=LIVE_EMAIL`, and `sdk_client_id_live` when deploying to production.
- GitHub Pages: perform placeholder injection in CI before publishing.

Optional future enhancements (opt-in, later)

- Add serverless endpoints for Orders API and webhook verification.
- Add PayPal JS SDK (opt-in) once server-assisted order creation is in place.
- Add automated Chrome Dev Tools MCP Server and Playwright MCP Server for cart → checkout rendering and form population (do not follow external redirect).

PR checklist (include in PR body)

- Title: `feat(payment): add minimal PayPal redirect checkout`
- Files added/modified list
- Smoke test steps & results (local server + sandbox flows)
- Confirm no secrets committed
- Confirm no inline JS/CSS
- Confirm `assets/js/data/paypal.json` contains placeholders only

Estimated effort

- MVP redirect-only: 4–8 hours (implementation + sandbox QA)
- Docs and CI examples: +1–2 hours

If you confirm, I'll implement the files now (cart.js, checkout.js, pages, config template, CSS partial, and app.js wiring) and open a PR with the changes and tests.

---

**Note:** This document is intentionally compact and prescriptive to keep the initial implementation minimal, auditable, and safe. Production-ready payment handling requires server-side verification which is listed under Optional future enhancements.
cert_url: req.headers['paypal-cert-url'],
transmission_id: req.headers['paypal-transmission-id'],
transmission_sig: req.headers['paypal-transmission-sig'],
transmission_time: req.headers['paypal-transmission-time'],
webhook_id: process.env.PAYPAL_WEBHOOK_ID,
webhook_event: req.body
})
});
const verifyJson = await verifyRes.json();
if (verifyJson.verification_status === 'SUCCESS') {
// process event: req.body.event_type e.g. PAYMENT.CAPTURE.COMPLETED
res.status(200).send('OK');
} else {
res.status(400).send('Invalid webhook signature');
}
}

````
- Important:
- `PAYPAL_WEBHOOK_ID` is the webhook ID in your PayPal app - store it in env vars.
- Validate the event type and order IDs match your records before fulfilling orders.

Phase 7 — CI / Hosting secret injection examples
- Goal: Replace placeholder values in `assets/js/data/paypal.json` during build with secrets from CI/host.

A — GitHub Actions example (inject production values during build)
- Replace placeholders using `jq` (recommended) or a small Node script.
- Workflow snippet:
```yaml
name: Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup jq
        run: sudo apt-get update && sudo apt-get install -y jq
      - name: Inject PayPal production config
        if: github.ref == 'refs/heads/main'
        env:
          PAYPAL_ENV: live
          PAYPAL_BUSINESS_EMAIL: ${{ secrets.PAYPAL_BUSINESS_EMAIL }}
          PAYPAL_SDK_CLIENT_ID_LIVE: ${{ secrets.PAYPAL_SDK_CLIENT_ID_LIVE }}
        run: |
          jq --arg env "$PAYPAL_ENV" \
             --arg business "$PAYPAL_BUSINESS_EMAIL" \
             --arg clientid "$PAYPAL_SDK_CLIENT_ID_LIVE" \
             '.env=$env | .business=$business | .sdk_client_id_live=$clientid' \
             assets/js/data/paypal.json > assets/js/data/paypal.json.tmp && mv assets/js/data/paypal.json.tmp assets/js/data/paypal.json
      - name: Build & Deploy
        run: |
          # your build and deploy commands
````

- Notes:
  - Keep `PAYPAL_BUSINESS_EMAIL` and `PAYPAL_SDK_CLIENT_ID_LIVE` in GitHub Secrets.
  - If using serverless endpoints, set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` as repo/organization secrets and pipeline env vars.

B — Netlify

- Netlify supports Build Environment Variables. Use a build script to generate `assets/js/data/paypal.json` at build time.
- Example build script (Node):
  ```js
  // build-scripts/inject-paypal.js
  const fs = require('fs');
  const path = './assets/js/data/paypal.json';
  const cfg = JSON.parse(fs.readFileSync(path));
  cfg.env = process.env.PAYPAL_ENV || cfg.env;
  cfg.business = process.env.PAYPAL_BUSINESS_EMAIL || cfg.business;
  cfg.sdk_client_id_live = process.env.PAYPAL_SDK_CLIENT_ID_LIVE || cfg.sdk_client_id_live;
  fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
  ```
- Add `npm run inject-paypal` to build command in Netlify settings.

C — Vercel

- Vercel env vars can be referenced in serverless functions. For static build-time injection, use a build script similar to Netlify and set Vercel Environment Variables.

D — Note on GitHub Pages

- GitHub Pages does not support runtime env vars. You must perform build-time injection in CI (Actions) before deploying.

Phase 8 — QA, testing, and automation

A — Manual QA checklist (detailed)

1. Confirm `pages/cart.html`:
   - Add multiple items and vary qty, ensure totals are correct.
   - Click "Proceed to checkout".
   - Check localStorage: `window.localStorage.getItem('naturesi_cart')` returns the canonical JSON array with numeric prices and integer qty.
2. Confirm `pages/checkout.html`:
   - Loads the cart summary, calculates totals, and displays per-line and grand totals.
   - Form hidden fields populated (`business`, `item_name`, `amount`) and form action points to sandbox URL (if config says sandbox).
   - If config.business missing, the page displays an error and disables submit.
3. PayPal redirect:
   - On clicking "Pay with PayPal", user is redirected to PayPal and sees correct total & item name.
   - Complete payment using sandbox buyer: user redirected to `pages/payment/success.html`.
   - Cancel payment: user redirected to `pages/payment/fail.html`.
   - Log into PayPal Sandbox Merchant to confirm transaction was recorded.
4. Edge cases:
   - Empty cart: checkout displays helpful message and disables pay button.
   - Malformed item: missing price => treated as 0; display visually and probably block checkout depending on policy.

B — Automated tests (suggestions)

- Unit tests for cart normalization / total calculation functions:
  - Test normalizeItem() with missing fields, wrong types, negative qtys.
  - Test computeTotal() with decimal rounding behavior.
- Integration/E2E tests (Chrome Dev Tools MCP Server and Playwright MCP Server):
  - Script: add item -> cart -> confirm -> checkout -> assert localStorage and page DOM for total.
  - For PayPal redirect, assert the form `action` and hidden inputs; do not follow external redirect.
- Example Chrome Dev Tools MCP Server and Playwright MCP Server test (pseudo):

Phase 9 — Production hardening & monitoring

- Add server-side verification (webhooks) and preferably server-assisted order creation/capture for production to prevent fraud.
- Track webhook events, log verification results, monitor failures.
- Implement monitoring metrics: transactions per minute, webhook verification failures, mismatched order totals.
- Log enough metadata to debug issues (order id, cart hash, timestamp, event type). Do not log PII.

Phase 10 — Rollout & rollback

- Deploy to staging (sandbox) first.
- Smoke test real flows with sandbox accounts.
- When ready:
  - Use CI to inject `env=live`, `business=live-business-email`, and `sdk_client_id_live`.
  - Deploy to production.
- Rollback plan:
  - If payment failures occur, revert to previous tag or re-deploy with `env=sandbox` configuration while investigating.

FILE MAP — EXACT FILES TO CREATE OR MODIFY

- pages/
  - `pages/checkout.html` (NEW)
  - `pages/payment/success.html` (NEW)
  - `pages/payment/fail.html` (NEW)
  - `pages/cart.html` (MODIFY: add confirm form/button)
- assets/css/
  - `assets/css/partials/checkout.css` (NEW)
  - `assets/css/partials/cart.css` (OPTIONAL NEW)
  - `assets/css/main.css` (MODIFY: import new partials)
- assets/js/
  - `assets/js/data/paypal.json` (NEW)
  - `assets/js/modules/cart.js` (NEW)
  - `assets/js/modules/checkout.js` (NEW)
  - `assets/js/modules/paypal-sdk.js` (OPTIONAL NEW)
  - `assets/js/app.js` (MODIFY: conditional imports based on DOM markers)
- .github/
  - `.github/PAYPAL_INTEGRATION.md` (NEW)
- Optional serverless endpoints (outside static site)
  - `/api/create-paypal-order` (serverless)
  - `/api/capture-paypal-order` or `/api/paypal/webhook` (serverless)

CART CONTRACT — EXACT SCHEMA (MUST BE FOLLOWED)

- localStorage key: `naturesi_cart`
- JSON value: array of objects
- Each object:
  - id: string
  - title: string
  - price: number (per-unit, numeric)
  - qty: integer
- Example (canonical):
  ```json
  [
    { "id": "sku-100", "title": "Chamomile Infusion 50g", "price": 9.95, "qty": 2 },
    { "id": "sku-101", "title": "Eucalyptus Steam 30g", "price": 6.5, "qty": 1 }
  ]
  ```
- If postage/shipping is needed, either:
  - Add a separate key `naturesi_cart_meta` with `{ postage: 4.50, shipping_method: 'Standard' }`, or
  - Include shipping as an item in cart with `id: 'shipping', title: 'Shipping - Standard', price: 4.5, qty: 1` — document which approach is used.

PAYPAL REDIRECT FORM OPTIONS — CHOICES EXPLAINED

- Aggregate single-item (`cmd=_xclick`):
  - Simpler: compute the total on client, set `amount` to grand total and use `item_name` as a descriptive string.
  - Downside: relies on client-calculated total for the PayPal UI; server-side verification recommended.
- Multi-item cart (`cmd=_cart` with `upload=1`):
  - Allows PayPal to display each line item but requires more form fields (`item_name_1`, `amount_1`, `quantity_1`, etc.).
  - Slightly more complex but might give better receipts on PayPal.
- For MVP choose aggregate (`_xclick`) to minimise complexity.

PRODUCTION SECURITY CHECKLIST

- Never commit live secrets (`client_secret`, live business email if not public) to the repository.
- Use CI secret injection or host env vars for serverless functions.
- For production, implement server-assisted order creation and webhook verification.
- Use HTTPS for all return/cancel URLs and API endpoints.
- Do not store cardholder data on your site. PayPal handles the payment data.
- Validate and sanitize all cart data on server before final fulfilment.
- Implement replay protection for webhooks (track `paypal-transmission-id`).

CI/DEPLOY EXAMPLES (SUMMARIZED)

- GitHub Actions: use `jq` or Node script to replace placeholders before build.
- Netlify: use environment variables and build script to write config file during `npm run build`.
- Vercel: use build script with Vercel Environment Vars (or serverless functions for secret operations).

EXTRA DEBUGGING & DEV NOTES

- If checkout shows incorrect total:
  - Inspect `localStorage.naturesi_cart` for numeric types (use devtools console).
  - Check `assets/js/modules/checkout.js` rounding (use toFixed(2) only on display or form values; compute totals with Number not string concatenation).
- If PayPal rejects return URL or shows 'invalid business':
  - Ensure business email matches sandbox business account or that sandbox account is active.
  - For SDK flows ensure `client-id` is for expected environment (sandbox vs live).
- If webhooks missing:
  - Check webhook registration in PayPal dashboard for the environment used (sandbox vs live).
  - Ensure public URL is reachable and returns 200 before registering.

EXHAUSTIVE QA TEST CASES (matrix)

- Functional:
  - Single item, qty 1
  - Single item, qty > 1
  - Multiple items with decimals and edge rounding (prices with 2 decimals)
  - Zero price item (should be allowed or blocked per policy)
  - Shipping as separate line vs meta key
  - Cancel on PayPal returns to cancel page
  - Success redirect returns to success page
- Robustness:
  - Malformed localStorage value (non-JSON) -> checkout shows message and cannot proceed
  - Missing cfg.business -> checkout disables pay button and shows warning
  - `sdk_enabled=true` but no client id -> module warns and falls back to redirect flow
- Security:
  - Attempt to tamper with localStorage values before form submission (test that server-side verification rejects mismatch)
  - Simulate replay webhook with reused `transmission-id` -> handler must prevent duplicate fulfilment

PR TEMPLATE & REVIEWER CHECKLIST

- PR title: `feat(payment): add minimal PayPal redirect checkout`
- Description must include:
  - Files added/modified list
  - Sandbox testing steps performed and results
  - Confirmation that no secrets committed
  - Screenshots of checkout and PayPal redirect screens (sandbox)
- Reviewer checklist:
  - [ ] No inline JS or CSS in HTML pages
  - [ ] `naturesi_cart` is produced by cart page and has canonical shape
  - [ ] checkout renders correct totals and currency
  - [ ] `assets/js/data/paypal.json` contains only placeholders for production
  - [ ] `assets/js/app.js` defers loading to modules conditionally
  - [ ] Optional SDK code is gated by `sdk_enabled`
  - [ ] Docs `.github/PAYPAL_INTEGRATION.md` updated
  - [ ] QA steps performed & logged in PR comments

LONG-TERM ENHANCEMENTS (post-MVP)

- Implement server-side order store with unique order id and server-side order verification.
- Support PayPal Orders API fully (create, approve, capture) with a serverless backend.
- Add invoices / receipts and send transactional emails on verified payments.
- Add admin dashboard to view orders and payment status.
- Add server-side retries and failure handling for webhooks.
- Add tests for webhook verification and order lifecycle.

REFERENCES

- PayPal Developer Home: https://developer.paypal.com/home/
- PayPal Checkout docs: https://developer.paypal.com/docs/checkout/
- PayPal JS SDK: https://developer.paypal.com/sdk/js/
- Payment links & buttons: https://developer.paypal.com/studio/checkout/payment-links-and-buttons
- Online payments doc: https://developer.paypal.com/docs/online/
- PayPal AI & pay-later: https://docs.paypal.ai/
- PayPal Invoicing: https://developer.paypal.com/docs/invoicing/

ESTIMATES (single developer)

- MVP redirect-only: 4–8 hours (including sandbox QA)
- Documentation and CI secret injection examples: +1–2 hours
- Optional SDK + serverless order creation + webhook verification: 1–3 days depending on host and complexity
