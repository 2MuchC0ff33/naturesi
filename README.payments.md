# Payments — PayPal (Simple redirect)

This project uses a minimal PayPal "redirect" integration (cmd=\_xclick single-total). This is intentionally simple and requires manual reconciliation until a server-side verification endpoint is implemented.

## Environment (deployment)

Place a `.env` file at the repository root (same folder as `index.html`) with the following keys (example in `.env.example`):

- PAYPAL_ENV=sandbox | live
- PAYPAL_BUSINESS_EMAIL=tea@naturesinfusions.com.au
- PAYPAL_RETURN_URL=https://www.naturesinfusions.com.au/payment/success.html
- PAYPAL_RETURN_URL_CANCEL=https://www.naturesinfusions.com.au/payment/fail.html

Note: this static repo reads `assets/js/data/paypal.json` at runtime. During deployment you should ensure `assets/js/data/paypal.json` reflects your environment (sandbox vs live) or replace it during the build step.

## How it works (high level)

- Clicking **Proceed to checkout** will:
  1. Collect and normalise the cart and persist it to `localStorage.naturesi_cart` (JSON **array**).
  2. Fetch `assets/js/data/paypal.json` for payment details (business email, return URLs, sandbox/live decision).
  3. Build an HTML form with `cmd=_xclick` and submit it to the PayPal sandbox or live URL. The user is redirected to PayPal to complete the payment.

## Testing (staging)

1. Set `PAYPAL_ENV=sandbox` and `PAYPAL_BUSINESS_EMAIL` to your sandbox merchant email in `.env` or ensure `assets/js/data/paypal.json` uses sandbox settings.
2. Start a local static server `npm run start:static` and open `http://localhost:8080`.
3. Add an item to the cart, open the cart, click **Proceed to checkout**.
4. On success the site will attempt to redirect to PayPal. In automated tests we intercept the form submit to verify payload rather than navigating to PayPal.

## Security & Operational Notes

- IMPORTANT: This client-side redirect is **not** authoritative proof of payment. You must manually verify PayPal payments in the merchant dashboard and reconcile orders until you implement server-side verification (IPN/webhooks or REST Order lookup).
- Do not store live secrets in the repository. Use environment variables (.env) and deploy safely.

## Troubleshooting

- If `paypal.json` fails to load the checkout falls back to the local checkout page and shows an error in `#checkout-error`. Check network logs and ensure `assets/js/data/paypal.json` is present and valid.
- For sandbox testing use PayPal Sandbox accounts and the PayPal developer dashboard.
