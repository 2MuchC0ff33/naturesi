# PayPal Sandbox Manual Test Steps

1. Create a PayPal Developer account at https://developer.paypal.com and sign in.
2. In the Dashboard, go to Sandbox > Accounts and create a **Business** (merchant) account. Note the merchant's sandbox email.
3. Create a **Personal** sandbox account (buyer) for completing purchases.
4. On your local server, set `assets/js/data/paypal.json` to use `env: "sandbox"` and `business: "<merchant-email>"` (manual edit for testing only).
5. Add items to the cart in the site, click "Proceed to checkout" and verify the checkout summary and PayPal hidden fields are populated.
6. Click "Pay with PayPal" — you should be redirected to the PayPal sandbox page showing the correct total and item description.
7. Log in with the sandbox buyer account and complete the payment; confirm redirect to `/pages/payment/success.html`.
8. Repeat and choose Cancel on the PayPal page to verify redirect to `/pages/payment/fail.html`.

Notes

- Do NOT commit live credentials. For CI or deployment, use a build-time injection process to set live config values.
