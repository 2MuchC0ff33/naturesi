# Batch 8 — Checkout & Payment Selector Audit

Scope
- Files inspected: `assets/js/modules/checkout-bootstrap.js`, `assets/js/modules/checkout.js`, `assets/js/modules/payment-return.js`, `assets/js/modules/payment-cancel.js`, `pages/checkout.html`, `pages/cart.html`, `pages/payment/success.html`, `pages/payment/fail.html`.

Key fragile selectors and runtime anchors (found)
- `summary-content` (id) — checkout line-item render target
- `payment` (id) — payment section root
- `checkout-note`, `checkout-error` (ids)
- `paypal-button-container` (id) — PayPal SDK render target (render called with selector string)
- `paypal-redirect-form` (id) — HTML fallback POST form
- PayPal redirect inputs: `pp-item_name`, `pp-amount`, `pp-notify`, `pp-invoice` (ids)
- `pay-now-redirect`, `pay-now` (ids) — redirect + SDK submit buttons
- `paypal-debug` (id) — debug UI
- `summary-shipping` (id / dataset.shipping) — shipping value read from DOM
- `cart-form`, `confirm-cart-form`, `btn-proceed-checkout`, `cart-cleared-note`, `cart-cancelled-note` (ids)
- localStorage keys: `naturesi_cart`, `naturesi-cart`, `autoCheckout`

Why these are fragile
- Hard-coded IDs used directly in JS create a coupling between templates and runtime. Removing/renaming an ID will silently break checkout or redirect flows.
- PayPal SDK render usage currently calls `.render('#paypal-button-container')` (string selector) — brittle if ID changes; the SDK also accepts an element which is less brittle.
- Several behaviours assume presence of DOM anchors (`summary-content`, `payment`) and abort silently when missing; this is safe but obscures failures in templating pipelines.

Immediate, low-risk mitigations (recommended, minimal change)
1. Add data-* hooks to the templates (preferred canonical hooks), keeping legacy IDs as fallback. Suggested hooks:
   - `data-checkout-summary` (on element currently `id="summary-content"`)
   - `data-checkout-payment` (on element currently `id="payment"`)
   - `data-paypal-button` (on element currently `id="paypal-button-container"`)
   - `data-paypal-redirect-form` (on `form#paypal-redirect-form`)
   - `data-pay-now` (on `#pay-now` / `#pay-now-redirect`)
   - `data-summary-shipping` (on `#summary-shipping`)

2. Update `checkout.js` lookups to prefer data attributes with legacy ID fallbacks. Example pattern:

```js
const paypalButtonContainer = documentRoot.querySelector('[data-paypal-button]') || documentRoot.getElementById('paypal-button-container');
// Prefer passing the element to SDK instead of a selector string
if (paypalButtonContainer) {
  paypal.Buttons(...).render(paypalButtonContainer);
}
```

3. Keep `paypal-redirect-form` population logic but prefer `form.querySelector('[name="amount"]')` etc. Add `data-paypal-amount` attributes if needed.

4. Explicitly reference `localStorage` keys in audit and do not rename them until cross-checks/tests are in place. Consider migrating to a single canonical key (e.g., `naturesi_cart`) after tests.

Recommended next steps (medium effort)
- Patch `pages/checkout.html` to add the `data-*` hooks listed above (add inline one-line comment referencing this audit). Keep IDs unchanged.
- Patch `assets/js/modules/checkout.js` to use the data-* lookup pattern (always fall back to existing IDs). Add unit tests around `parseCartRaw`, `renderSummaryToString` (already exported) and a small integration smoke test exercising `setupPaypalRedirect()` and the redirect form population.
- Replace SDK `.render('#paypal-button-container')` with `.render(paypalButtonContainer)` (pass element) and guard if SDK API changes (string vs element supported) — test in sandbox.
- Add an item to the QA checklist (`analysis/cart-qa-checklist.md`) to verify: redirect form populated, SDK buttons rendered (when configured), redirect flow submits, and localStorage cleared on success page.

Security / CSP notes
- CSP in `pages/cart.html` already includes PayPal hosts — good. When switching to SDK script injection ensure CSP `script-src` allows PayPal domain or prefer server-side configuration.
- When populating redirect `notify_url` and `return` values from `paypal.json`, ensure values are validated (origin prefix) to prevent malicious redirect insertion.

Testing & rollback guidance
- Deploy the `data-*` attribute changes and `checkout.js` lookup changes together in a single small PR; keep legacy IDs in place so the change is reversible with no runtime downtime.
- Run the Playwright smoke test (added earlier) after the change plus manual checks: load `/pages/checkout.html?debug=1` confirm debug values, click redirect (sandbox), and confirm `pages/payment/success.html` clears localStorage.

Conclusion
- No blocking issues found; checkout relies on a small set of well-known IDs and localStorage keys. Adding `data-*` hooks and preferring them in JS will make future safe selector modernisation straightforward. If you want I can implement the conservative code changes (prefer data-* then fallback) and add the `data-*` attributes to `pages/checkout.html` in a follow-up patch.
