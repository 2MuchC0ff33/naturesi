HTML validation triage — prioritized fixes

Summary

This document lists the remaining structural HTML issues discovered by site scans: duplicate IDs within single documents, duplicated document fragments (multiple DOCTYPE/header/main/footer blocks), and a small set of fieldset/legend checks. Each item includes: location, reason it's a problem, recommended fix, risk, and estimated effort.

High priority (must fix before merge)

1. Duplicate document fragments (multiple DOCTYPE / repeated header/footer/main inside a single file)

- Files found with duplicated skeleton fragments: `pages/terms.html`, `pages/about.html`, `pages/social.html`, `pages/contact.html`.
- Why: Having multiple `<!DOCTYPE>` or repeated `<html>/<head>/<body>` fragments in one file produces invalid documents, confuses validators and parsers, duplicates IDs and landmarks (e.g. `site-header`, `main-content`) and breaks accessibility and navigation.
- Recommended fix: For each file, keep a single page skeleton (one `<!DOCTYPE>` / `<html>` / `<head>` / opening `<body>` and single closing `</body></html>`). Remove any appended duplicate fragments (likely introduced by copy/paste). If repeated content must remain for legacy/preview reasons, convert the duplicates into sections without skeleton-level markup (i.e. remove the extra `<html>...` wrappers and merge the inner content into the primary body).
- Risk: Medium. Removing whole duplicate fragments can change page order/meaning if not reviewed. Manual sanity-check and view the page locally needed.
- Effort: 15–45 minutes per file (manual review + run `npx html-validate`).
- Files/Examples:
  - `pages/terms.html` — multiple `<!DOCTYPE html>` occurrences and repeated `site-header`/`main-content` (evidence: duplicate `<!DOCTYPE` at two places).
  - `pages/about.html` — duplicate `section`/`header` blocks, repeated `about-page` and `page-header` IDs.
  - `pages/social.html` — repeated `site-header` and `header` fragments.
  - `pages/contact.html` — contains header/menu fragment duplicated; check for stray `</script>` closing markers near the end (some pages contain scripts duplicated at document end).

Medium priority (recommended fixes)

2. Repeated in-document IDs used for non-unique UI elements (convert to classes or unique IDs)

- Files affected (representative): many store category pages (product pages) including `pages/store/artisan-blends.html`, `pages/store/black-tea.html`, `pages/store/balms.html`, `pages/store/creams.html`, `pages/store/green-tea.html`, `pages/store/herbal-infusions.html`, `pages/store/ice-tea.html`, `pages/store/selfcare.html`, `pages/store/wellness-blends.html`, and other product pages.
- Symptom: The same id attribute `package-label` (and similar) is reused for every product block in the page. IDs must be unique within a document; repeated ids break fragment linking and some ARIA/labeling behaviour and will be flagged by validators.
- Recommended fix: Replace repeated ids used for styling/structure with classes (e.g. `class="package-label"`) or make IDs unique by appending a product slug (e.g. `id="package-label-product-ceylon"`). Prefer using classes unless some script needs the exact id.
- Risk: Low — typically these IDs are only used for headings and styling; remove/convert them to classes is safe as long as JS does not rely on them. If JS expects an ID, update the JS selectors accordingly (search repo for `#package-label` before change).
- Effort: ~5–10 minutes per page to replace `id` with `class` + quick smoke-test.

3. Repeated landmark/utility ids in page fragments (e.g. `page-header`, `about-page`, `main-content` duplicated inside one file)

- Files: `pages/about.html`, `pages/terms.html`, a few store pages where fragments were appended.
- Symptom: Duplicate landmarks reduce usability of skip-links, cause non-unique references by `aria-labelledby`, and confuse screen readers.
- Recommended fix: If duplicates are from duplicate fragments, remove the duplicated fragments (see item #1). Otherwise, ensure landmark IDs are unique or switch repeated elements to use classes and refer to them via `aria-label` instead of `aria-labelledby` when appropriate.
- Risk: Medium (affects accessibility). Manual verification by keyboard navigation and a screen reader simulator is advised.
- Effort: 10–30 minutes per affected file.

Low priority (nice-to-have)

4. Consolidate repeated HTML comments with '&' into safer wording (already done in low-risk step)

- Files: various. This is already addressed (replaced `&` with `and` in comments). No further action required unless you want uniform comment language.
- Risk: None. Effort: trivial.

5. Fieldset / legend checks

- Current scan shows most product `fieldset` blocks already have `legend` (e.g. "Product Options", "Out of Stock Notification"), and the contact page `fieldset` blocks contain legends. If any `fieldset` lacks `legend` the fix is to add one.
- Files to spot-check: all pages found with `fieldset` — use `npx html-validate` after structural fixes to ensure `wcag/h71` is clear.
- Risk: Low. Effort: small per fieldset.

Suggested step-by-step plan (safe, small commits)

1. Create a working branch `fix/html-structure-triage` (or keep working on `feature/search-client-products` if preferred).
2. High priority commits — per-file:
   - `fix(html): deduplicate skeleton in pages/terms.html` — remove extra `<!DOCTYPE` and duplicate header/footer fragments; run html-validate and smoke-test.
   - Repeat for `pages/about.html`, `pages/social.html`, `pages/contact.html`.
   - Commit and run `npx html-validate "pages/**/*.html" "index.html"` — confirm errors drop.
3. Medium priority commits — replace non-unique IDs with classes across product pages:
   - `fix(html): convert repeated package-label ids to class on store product pages` — change `id="package-label"` → `class="package-label"` in all `pages/store/*.html`. Search for any script that references `#package-label` and update selectors to `.package-label` if necessary.
   - Run `npx eslint` to check JS changes if any, and `npx html-validate`.
4. Medium priority — fix duplicated landmark ids if any remain:
   - `fix(html): ensure unique landmark IDs or replace with aria-labels`.
5. Low priority — minor polish (comments, titles, small text entities) and generate a validation report.

Testing checklist per commit

- Run: `npx html-validate "pages/**/*.html" "index.html"` and confirm targeted rules are resolved.
- Run: `npx html-validate --rules` (or the project’s configured rule set) to ensure no regressions.
- Smoke test pages locally (e.g. `python -m http.server 8000`), navigate key pages and confirm:
  - Header and skip link behaviour works and lands at the correct `main` anchor.
  - Product anchors and per-product options still function and forms submit (or show form behaviour) as expected.
  - PayPal/cart workflows are not altered (no edits to PayPal forms, checkout flow or PayPal email were touched in triage).
- Accessibility smoke: keyboard navigation and basic ARIA checks for modified pages.

Files I recommend fixing first (ordered by priority and impact)

1. `pages/terms.html` — remove duplicated skeleton and ensure single header/main/footer (high)
2. `pages/about.html` — remove duplicated page fragments (high)
3. `pages/contact.html` — remove duplication and ensure the contact form fieldsets/legend/labels are correct (high)
4. `pages/social.html` — remove duplication (high)
5. `pages/store/*.html` — convert repeated `package-label` IDs to classes across product pages (medium)
6. Re-run `npx html-validate` and `npx pa11y` for selected pages (medium)

If you want, I can implement the highest-priority fixes now (start with `pages/terms.html` and `pages/about.html`) and open a draft PR with small, atomic commits. Which files should I fix first? (I recommend starting with `pages/terms.html`.)
