# PayPal Integration (Minimal Redirect Checkout)

This document explains the minimal PayPal redirect checkout implemented in the repository and provides guidance for deployment and sandbox testing.

Overview

- The site implements a redirect-only PayPal checkout using a single aggregated payment (`cmd=_xclick`).
- Configuration is located at `assets/js/data/paypal.json` (sandbox placeholders by default).
- The client computes the total and posts a simple form to PayPal sandbox or live.

Sandbox testing

1. Create a PayPal Developer account: https://developer.paypal.com
2. Go to Sandbox > Accounts and create a Business (merchant) account. Note the merchant email.
3. Create at least one Personal (buyer) account for completing purchases.
4. Update `assets/js/data/paypal.json` temporarily to set `env: "sandbox"` and `business: "MERCHANT_SANDBOX_EMAIL"`.
5. Add items to cart, proceed to `/pages/checkout.html`, confirm the summary and the hidden form fields, then click "Pay with PayPal".
6. Use the sandbox buyer to complete the payment and confirm redirect to `/pages/payment/success.html`. Use Cancel to confirm redirect to `/pages/payment/fail.html`.

Deployment / CI notes

- Do NOT commit production secrets. For production, replace placeholders at build time using CI/host environment variables.
- Example (CI): use a small Node script or `jq` in your pipeline to inject `env=live` and `business=LIVE_EMAIL` into `assets/js/data/paypal.json` during the build step.

Security

- Client-side totals are vulnerable to tampering; production must implement server-assisted order creation and webhook verification before fulfilling orders.
- Never log or store payment card details.

Optional enhancements

- Add serverless endpoints to create and capture orders using PayPal Orders API.
- Add automated E2E tests for PayPal flows (requires NativeNodeModules/ZombieJS/QuickJS/wkhtmltoimage/whtmltopdf).
