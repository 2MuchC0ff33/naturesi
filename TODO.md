# TODO: Complete, Detailed Implementation Plan — Minimal PayPal Redirect Checkout
Last updated: 2026-01-10  
Repository: 2MuchC0ff33/naturesi

Overview
- Goal: Add a mobile-first, HTML-first checkout flow that redirects customers to PayPal for payment and returns them to:
  - success: `pages/payment/success.html`
  - cancel/fail: `pages/payment/fail.html`
- Keep the integration minimal and modular:
  - HTML5 first, then CSS partials, then native Web APIs, and only minimal JS.
  - No inline CSS or inline JS in any HTML.
  - All new CSS partials must be placed under `assets/css/partials/*.css` and imported into `assets/css/main.css`.
  - All new JS modules must be placed under `assets/js/modules/*.js` and imported/bootstrapped via `assets/js/app.js`.
  - Configuration JSON files must be under `assets/js/data/*.json`.
- Ensure `pages/cart.html` stores the confirmed cart in localStorage under the key `naturesi_cart` in the canonical format so the checkout page can reliably consume it.
- Provide an optional, documented client-side PayPal JS SDK integration (opt-in) for improved UX.
- Produce `.github/PAYPAL_INTEGRATION.md` (or update README) with instructions for switching sandbox/live and provisioning secrets through CI/hosting.

Contents of this TODO
- Implementation roadmap (phases, tasks, file map)
- Precise canonical cart contract (schema)
- Exact HTML/CSS/JS placement rules
- Concrete sample snippets (HTML form, JSON config, minimal JS pseudocode)
- Optional PayPal JS SDK flow (client-only and server-assisted)
- Server-side / serverless examples (create-order, verify-webhook)
- CI / hosting secret-injection templates (GitHub Actions, Netlify, Vercel)
- Manual QA and automated testing examples (Playwright sample)
- Security, privacy, and production checklist
- Monitoring, logging, rollback, post-deploy tasks
- PR template and reviewer checklist
- PayPal reference URLs

IMPLEMENTATION ROADMAP — PHASED

Phase 0 — Prep & account setup (developer)
- Create/verify a PayPal Developer account: https://developer.paypal.com/home/
- In Developer Dashboard:
  - Create or note a Sandbox Business account (merchant) email.
  - Create Sandbox buyer accounts for manual testing.
  - Note `Sandbox Client ID` (for optional client-side SDK testing). Client ID is not a secret.
  - For production, generate `Live Client ID` and `Live Client Secret` and keep them in secure vaults (CI secrets, host env vars).
- Collect required information:
  - sandbox_business_email
  - sandbox_client_id
  - live_business_email (do NOT commit)
  - live_client_id (do NOT commit)
  - live_client_secret (do NOT commit)

Phase 1 — Configuration scaffolding (safe static files)
Files to add:
- `assets/js/data/paypal.json` — configuration and placeholders.
  - Purpose: single source for env, endpoints, business emails, client IDs, currency and return paths.
  - Template (placeholders must be replaced via CI / build step for production):
    ```json
    {
      "env": "sandbox",
      "business": "sandbox-business@example.com",
      "currency": "AUD",
      "sandbox_url": "https://www.sandbox.paypal.com/cgi-bin/webscr",
      "live_url": "https://www.paypal.com/cgi-bin/webscr",
      "return_path": "/pages/payment/success.html",
      "cancel_path": "/pages/payment/fail.html",
      "sdk_client_id_sandbox": "REPLACE_WITH_SANDBOX_CLIENT_ID",
      "sdk_client_id_live": "REPLACE_WITH_LIVE_CLIENT_ID",
      "sdk_enabled": false
    }
    ```
- `.github/PAYPAL_INTEGRATION.md` — initial placeholder (detailed content expanded later).

Phase 2 — Cart page changes (HTML-first, then JS)
Goal: Make `pages/cart.html` produce canonical `naturesi_cart` localStorage entry when user confirms cart/postage and chooses to proceed.

A — HTML (cart page)
- Add a semantic form or accessible button to finalize and proceed:
  - Prefer `<form id="confirm-cart-form" method="post" action="/pages/checkout.html">` where the `<button type="submit">` triggers the normal flow. If your cart page uses JS to manage cart, use a button with id `btn-proceed-checkout`.
- Example HTML snippet (for `pages/cart.html`):
  ```html
  <form id="confirm-cart-form" aria-label="Confirm items and proceed to checkout">
    <!-- existing cart UI elements here -->
    <button type="submit" id="btn-proceed-checkout" class="btn btn-primary">Proceed to checkout</button>
  </form>
  ```
- Note: The form does not need inline JS. We'll attach behavior via `assets/js/modules/cart.js`.

B — JS (cart module)
- File: `assets/js/modules/cart.js`
- Responsibilities:
  - On submit, collect the confirmed cart data from canonical source (preferably an in-memory cart object on the page; fallback to DOM).
  - Normalize and validate the cart into canonical shape (see "Cart contract" below).
  - Save to localStorage key `naturesi_cart`.
  - Optionally save shipping/postage summary to `naturesi_cart_meta` (or similar).
  - Redirect to `/pages/checkout.html`.
- Minimal structure example (to be placed inside `assets/js/modules/cart.js`):
  ```javascript
  (function () {
    const CART_KEY = 'naturesi_cart';
    const form = document.getElementById('confirm-cart-form');
    if (!form) return;

    function collectCart() {
      // Try to read from global JS cart if available:
      if (window.appCart && Array.isArray(window.appCart)) {
        return window.appCart.map(normalizeItem);
      }
      // Otherwise parse DOM elements (find .cart-item elements with data attributes)
      // Implementation depends on your cart markup; this is pseudo-code
      const items = [];
      document.querySelectorAll('.cart-item').forEach(el => {
        const id = el.dataset.id;
        const title = el.querySelector('.item-title').textContent.trim();
        const price = parseFloat(el.querySelector('.item-price').dataset.value);
        const qty = parseInt(el.querySelector('.item-qty').value, 10) || 1;
        items.push({id, title, price, qty});
      });
      return items.map(normalizeItem);
    }

    function normalizeItem(item) {
      return {
        id: String(item.id || ''),
        title: String(item.title || 'Item'),
        price: Number(item.price || 0),
        qty: parseInt(item.qty || 1, 10)
      };
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const items = collectCart();
      if (!items.length) {
        // display accessible error and abort
        alert('Your cart is empty');
        return;
      }
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      window.location.href = '/pages/checkout.html';
    });
  })();
  ```
- Loading:
  - `assets/js/app.js` must dynamically import `assets/js/modules/cart.js` only when `#confirm-cart-form` exists to keep runtime minimal.

Phase 3 — Checkout page (HTML-first)
Goal: `pages/checkout.html` must be fully accessible and functional. The page uses minimal JS to render the order summary and populate the PayPal redirect form (no inline JS).

A — HTML (pages/checkout.html)
- Create the page with:
  - Header, navigation, main, footer.
  - Order summary section (id `order-summary` with inner `#summary-content`).
  - Payment section containing the minimal PayPal redirect form.
- PayPal form specifics (MVP single-item aggregate approach):
  - Form method = POST.
  - `id="paypal-form"`
  - hidden inputs:
    - `cmd = _xclick` (single aggregate item)
    - `business` (populated by JS)
    - `item_name` (populated by JS)
    - `amount` (populated by JS)
    - `currency_code` (default from config)
    - `return` and `cancel_return` populated from config
- Example snippet:
  ```html
  <form id="paypal-form" method="post" action="https://www.sandbox.paypal.com/cgi-bin/webscr" novalidate>
    <input type="hidden" name="cmd" value="_xclick">
    <input type="hidden" name="business" id="pp-business" value="">
    <input type="hidden" name="item_name" id="pp-item_name" value="">
    <input type="hidden" name="amount" id="pp-amount" value="">
    <input type="hidden" name="currency_code" id="pp-currency" value="AUD">
    <input type="hidden" name="return" id="pp-return" value="/pages/payment/success.html">
    <input type="hidden" name="cancel_return" id="pp-cancel" value="/pages/payment/fail.html">
    <button type="submit" id="pay-now" class="btn btn-primary">Pay with PayPal</button>
  </form>
  ```
- Accessibility:
  - Provide explanatory text about redirection and privacy (no payment data stored on site).
  - Provide fallback message in `<noscript>`.

B — JS (checkout module)
- File: `assets/js/modules/checkout.js`
- Responsibilities:
  - Load `assets/js/data/paypal.json` (fetch) to determine environment (sandbox/live), business email, currency, endpoints and SDK settings.
  - Read `naturesi_cart` from localStorage and parse it.
  - Validate and normalize items (enforce numbers, integer qty).
  - Render accessible order summary into `#summary-content`.
  - Compute total: sum(price * qty) (prefer fixed 2 decimals).
  - Populate the PayPal form hidden inputs:
    - `#pp-business` = config.business
    - `#pp-item_name` = concise string (join first few item titles with qtys)
    - `#pp-amount` = total.toFixed(2)
    - `#pp-currency` = config.currency
    - Set `#paypal-form.action` to sandbox_url or live_url based on env
    - `#pp-return` and `#pp-cancel` updated to config.return_path and config.cancel_path
  - If `business` missing or cart invalid:
    - Render clear message and disable submit button.
- Minimal code example (for guidance, adapted to your environment; place in modules):
  ```javascript
  (async function () {
    const CART_KEY = 'naturesi_cart';
    const form = document.getElementById('paypal-form');
    const summaryEl = document.getElementById('summary-content');
    if (!form || !summaryEl) return;

    // Load config
    let cfg = { env: 'sandbox', business: '', currency: 'AUD', sandbox_url: '', live_url: '', return_path: '/pages/payment/success.html', cancel_path: '/pages/payment/fail.html' };
    try {
      const res = await fetch('/assets/js/data/paypal.json', {cache: 'no-store'});
      if (res.ok) cfg = await res.json();
    } catch (err) { console.warn(err); }

    // Set endpoint
    if (cfg.env === 'live' && cfg.live_url) form.action = cfg.live_url;
    else if (cfg.sandbox_url) form.action = cfg.sandbox_url;

    // Parse cart
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(e) { cart = []; }
    if (!Array.isArray(cart) || cart.length === 0) {
      summaryEl.innerHTML = '<p class="muted">Your cart is empty. <a href="/pages/store/index.html">Continue shopping</a>.</p>';
      form.querySelector('button[type="submit"]').disabled = true;
      return;
    }

    // Render summary & compute total
    let total = 0;
    const ul = document.createElement('ul');
    ul.setAttribute('aria-label', 'Order items');
    cart.forEach(item => {
      const price = Number(item.price || 0);
      const qty = parseInt(item.qty || 1, 10);
      const line = price * qty;
      total += line;
      const li = document.createElement('li');
      li.textContent = `${item.title} × ${qty} — ${line.toFixed(2)} ${cfg.currency}`;
      ul.appendChild(li);
    });
    const totalEl = document.createElement('p');
    totalEl.innerHTML = `<strong>Total: ${total.toFixed(2)} ${cfg.currency}</strong>`;
    summaryEl.innerHTML = '';
    summaryEl.appendChild(ul);
    summaryEl.appendChild(totalEl);

    // Populate form
    document.getElementById('pp-business').value = cfg.business || '';
    document.getElementById('pp-amount').value = total.toFixed(2);
    document.getElementById('pp-item_name').value = cart.map(i => `${i.qty}× ${i.title}`).join(' • ').slice(0, 127) || "Nature's Infusions Order";
    document.getElementById('pp-currency').value = cfg.currency || 'AUD';
    document.getElementById('pp-return').value = cfg.return_path || '/pages/payment/success.html';
    document.getElementById('pp-cancel').value = cfg.cancel_path || '/pages/payment/fail.html';

    if (!cfg.business) {
      const warn = document.createElement('p');
      warn.className = 'error';
      warn.textContent = 'Payment gateway not configured. Please contact support.';
      summaryEl.appendChild(warn);
      form.querySelector('button[type="submit"]').disabled = true;
    }
  })();
  ```
- Loading:
  - `assets/js/app.js` should detect `#paypal-form` and dynamic import checkout module.

Phase 4 — Styling (CSS partials)
- Create `assets/css/partials/checkout.css` for checkout page styles (mobile-first, accessible).
- Create `assets/css/partials/cart.css` if cart UI needs style changes.
- Ensure `assets/css/main.css` imports the partials:
  ```css
  /* assets/css/main.css */
  @import url('partials/checkout.css');
  @import url('partials/cart.css'); /* optional */
  ```
- Keep styles simple, responsive, and prefer system fonts. Use CSS variables for colors to match site theme.

Phase 5 — Optional: Client-side PayPal JS SDK integration (opt-in)
- Rationale: SDK produces an in-context hosted experience and can perform authorizations/captures with better UX. For production you should still create orders server-side to avoid price tampering.
- Toggle:
  - Add `sdk_enabled` boolean in `assets/js/data/paypal.json`.
  - Add `sdk_client_id_sandbox` and `sdk_client_id_live` fields (client-id is not secret).
- Two implementation modes:
  - Client-only (sandbox/demo only) — quick and insecure for production.
  - Server-assisted (recommended) — create order on the server, return orderID to client SDK.
- Files:
  - `assets/js/modules/paypal-sdk.js` — dynamically load `https://www.paypal.com/sdk/js?client-id=...&currency=AUD` and render `paypal.Buttons(...)`.
- Minimal client-only example (for sandbox/demo only):
  ```javascript
  // Load SDK dynamically in paypal-sdk.js
  (async function () {
    const cfg = await fetch('/assets/js/data/paypal.json').then(r => r.json());
    if (!cfg.sdk_enabled) return;
    const clientId = cfg.env === 'live' ? cfg.sdk_client_id_live : cfg.sdk_client_id_sandbox;
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${cfg.currency || 'AUD'}`;
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => {
      paypal.Buttons({
        createOrder: (data, actions) => {
          // Use local cart summary to compute total
          const cart = JSON.parse(localStorage.getItem('naturesi_cart') || '[]');
          const total = cart.reduce((s, i) => s + (Number(i.price || 0) * Number(i.qty || 1)), 0).toFixed(2);
          return actions.order.create({ purchase_units: [{ amount: { value: total } }] });
        },
        onApprove: (data, actions) => actions.order.capture().then(() => window.location.href = cfg.return_path),
        onCancel: () => window.location.href = cfg.cancel_path
      }).render('#paypal-button-container');
    };
  })();
  ```
- Recommended server-assisted SDK flow (production):
  1. Client calls `/api/create-paypal-order` with order details (or order id).
  2. Server uses PayPal Orders API with server-side credentials to create an order and returns `orderID`.
  3. Client uses `paypal.Buttons({ createOrder: () => orderID })` or calls `actions.order.create({})` with returned ID.
  4. On `onApprove`, client calls server `/api/capture-paypal-order` to capture and verify or the server captures immediately upon webhook .
  5. Server verifies capture and finalizes order (send email, update DB, etc).
- Note: Server-assisted approach requires server-side secrets (client_secret). See Phase 7 for serverless examples.

Phase 6 — Server-side / serverless examples (order creation & webhook verification)
- These steps are recommended for production. They require serverless functions or a backend (e.g., Netlify Functions, Vercel Serverless, AWS Lambda, Express app).

A — Create order endpoint (server)
- POST `/api/create-paypal-order`
- Body: order summary or order id referencing your server-side DB
- Sample Node.js (serverless) using fetch (v2/orders):
  ```javascript
  // create-order.js (serverless)
  import fetch from 'node-fetch';

  async function getAccessToken(clientId, clientSecret) {
    const tokenRes = await fetch(`https://api-m.${isLive ? 'paypal.com' : 'sandbox.paypal.com'}/v1/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
      auth: `${clientId}:${clientSecret}` // Or use basic auth header
    });
    const tokenJson = await tokenRes.json();
    return tokenJson.access_token;
  }

  export default async function handler(req, res) {
    const { cart } = req.body; // validate server-side
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const isLive = process.env.PAYPAL_ENV === 'live';

    const accessToken = await getAccessToken(clientId, clientSecret);
    const orderRes = await fetch(`https://api-m.${isLive ? 'paypal.com' : 'sandbox.paypal.com'}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'AUD',
            value: computeTotal(cart).toFixed(2)
          }
        }],
        application_context: {
          return_url: 'https://your-site/pages/payment/success.html',
          cancel_url: 'https://your-site/pages/payment/fail.html'
        }
      })
    });
    const order = await orderRes.json();
    res.json(order);
  }
  ```
- Note: In serverless functions use `Authorization` header for OAuth token retrieval via Basic auth:
  - `Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')`.

B — Capture/verify endpoint or webhook processing
- Preferred: Use PayPal Webhooks for event verification and reliability.
- Webhook verification endpoint sample using Verify Webhook Signature:
  1. Receive webhook HTTP POST from PayPal with headers:
     - `paypal-transmission-id`
     - `paypal-transmission-time`
     - `paypal-transmission-sig`
     - `paypal-cert-url`
     - `paypal-auth-algo`
     - `webhook-id` (the webhook id registered in your PayPal app)
  2. Call `POST /v1/notifications/verify-webhook-signature` with JSON payload containing the values above and the raw webhook body to confirm PayPal signature.
  3. If verification returns `VERIFIED`, process the event (e.g., `PAYMENT.CAPTURE.COMPLETED`).
- Sample Node.js (serverless) verify call:
  ```javascript
  // verify-webhook.js (serverless)
  import fetch from 'node-fetch';

  async function getAccessToken(clientId, clientSecret) { /* same as above */ }

  export default async function handler(req, res) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const isLive = process.env.PAYPAL_ENV === 'live';
    const accessToken = await getAccessToken(clientId, clientSecret);

    const verifyRes = await fetch(`https://api-m.${isLive ? 'paypal.com' : 'sandbox.paypal.com'}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        auth_algo: req.headers['paypal-auth-algo'],
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
  ```
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
  ```
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
- Integration/E2E tests (Playwright/Puppeteer):
  - Script: add item -> cart -> confirm -> checkout -> assert localStorage and page DOM for total.
  - For PayPal redirect, assert the form `action` and hidden inputs; do not follow external redirect.
- Example Playwright test (pseudo):
  ```javascript
  const { test, expect } = require('@playwright/test');

  test('checkout page renders totals from cart', async ({ page }) => {
    // Prepare cart in localStorage directly
    await page.addInitScript(() => {
      localStorage.setItem('naturesi_cart', JSON.stringify([{id:'sku-1',title:'T1',price:9.95,qty:2}]));
    });
    await page.goto('http://localhost:8000/pages/checkout.html');
    const total = await page.textContent('#summary-content p strong');
    expect(total).toContain('19.90');
    // Check form fields
    expect(await page.getAttribute('#pp-amount', 'value')).toBe('19.90');
  });
  ```

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
    {"id":"sku-100","title":"Chamomile Infusion 50g","price":9.95,"qty":2},
    {"id":"sku-101","title":"Eucalyptus Steam 30g","price":6.50,"qty":1}
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
