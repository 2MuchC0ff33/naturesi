Consolidate repeated HTML comments with '&' into safer wording (already done in low-risk step)

- Files: various. This is already addressed (replaced `&` with `and` in comments). No further action required unless you want uniform comment language.
- Risk: None. Effort: trivial.

5. Fieldset / legend checks

- Current scan shows most product `fieldset` blocks already have `legend` (e.g. "Product Options", "Out of Stock Notification"), and the contact page `fieldset` blocks contain legends. If any `fieldset` lacks `legend` the fix is to add one.
- Files to spot-check: all pages found with `fieldset` — use `npx html-validate` after structural fixes to ensure `wcag/h71` is clear.
- Risk: Low. Effort: small per fieldset.

Accessibility checks: run pa11y against each changed page (e.g. terms.html, about.html, contact.html, social.html) and address any issues
