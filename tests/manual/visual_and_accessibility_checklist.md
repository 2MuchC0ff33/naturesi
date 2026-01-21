# Visual and Accessibility Manual Checklist

Follow these steps manually or as part of visual QA. Keep notes in the PR.

Pages to check

- /index.html
- /pages/store.html and representative category pages
- /pages/cart.html
- /pages/checkout.html
- /pages/payment/success.html and /pages/payment/fail.html

Checks

- [ ] Keyboard navigation: tab through main interactive controls (nav, search, cart, proceed to checkout, pay button)
- [ ] Focus styles visible at 2x and 4x zoom
- [ ] Form controls have associated `<label for>` or `aria-label` where appropriate
- [ ] Images have meaningful `alt` attributes or `role="presentation"` for decorative images
- [ ] Contrast ratios are acceptable (primary text vs background)
- [ ] Checkout summary renders clearly on narrow (320px) and wide screens
- [ ] PayPal redirect notice text is present and understandable

Notes

- For screenshot-based visual diffs, consider adding NativeNodeModules/ZombieJS/QuickJS/wkhtmltoimage/whtmltopdf (opt-in). For now, capture full-page screenshots manually using browser devtools (Ctrl+Shift+P -> Capture full size). Document differences in the PR.
