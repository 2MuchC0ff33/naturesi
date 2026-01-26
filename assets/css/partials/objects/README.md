# Objects layer — Usage

This README summarises the object classes available under `assets/css/partials/objects/`.
They are intentionally undecorated and layout-focused (ITCSS Objects layer).

Principles
- Mobile-first, lightweight, single-purpose classes.
- Keep specificity low and avoid visual decoration here.
- Use aliases (`.o-*`) where helpful for migration.

Key classes
- `.wrapper` / `.o-wrapper` — page framing (horizontal padding, centring).
- `.container` / `.o-container` — constrains content width (modifiers: `--narrow`, `--lg`, `--fluid`).
- `.stack`, `.stack--sm`, `.stack--lg`, `.stack--reverse` — vertical flow helpers.
- `.row`, `.row--space-between`, `.row--center`, `.items-center` — row helpers.
- `.grid`, `.grid-auto-fit`, `.grid--cols-2`, `.grid--cols-3` — grid helpers (mobile-first).
- `.media`, `.media__img`, `.media__body`, `.media--reverse` — media object pattern.
- `.modal`, `.modal__overlay`, `.modal__dialog` — modal skeleton (behaviour in JS module `assets/js/modules/modal.js`).
- `.hide--sm-up`, `.hide--md-up`, `.show--md-up` — small responsive show/hide helpers.

Accessibility notes
- Modals: use `role="dialog"`, `aria-modal="true"`, `aria-labelledby` and ensure the JS module traps focus and returns focus to the trigger.
- Media object: prefer keeping semantic DOM order (image then content) to preserve reading order on assistive tech.

Usage examples
- Page wrapper: `<div class="wrapper"> <main class="container"> … </main> </div>`
- Product media: `<header class="media"> <figure class="media__img">…</figure> <div class="media__body">…</div> </header>`
- Modal trigger: `<button data-modal-target="#newsletter-modal">Open</button>` followed by modal markup.

Notes
- This file is informational only; keep component-specific visual styling in `partials/components/`.
- Test key flows (cart, checkout, PayPal) after layout changes to avoid regressions.
