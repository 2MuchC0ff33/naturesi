# Copilot instructions — Nature's Infusions (static  EStore)

Purpose: give an AI coding agent the minimal, practical context needed to be productive editing this repo.

Checklist for this task
- Understand this is a static, mobile-first (no build step).
- Preserve privacy-first and accessibility-first constraints (no analytics, no cookies).
- Make only minimal, reversible edits; follow repository conventions (single-file HTML pages,  scripts mentioned in docs).
 - Use Australian English (`en-AU`) for all new copy, comments, commit messages and code-facing strings. Prefer Australian spellings (e.g. "colour", "organisation", "labour") and DD/MM/YYYY dates where a format is required.

Big picture
- This is an Ultra-Simple  Static EStore: plain HTML, CSS, and vanilla JS. There is no Node/npm build pipeline or tests directory. Edits are direct to files in repo root, `pages/`, `assets/css/`, and `assets/js/`.
- Data: product metadata appears in `products.json` and `.env` points to CSV paths (e.g. `PRODUCTS_CSV_PATH=data/products.csv`), suggesting small CSV/JSON-based data flows rather than a database.

Key patterns & conventions (concrete examples)
- Service worker: dev/no-cache pattern — see `service-worker.js` and registration guards in `assets/js/app.js` (only register on `localhost` or `https:`). Avoid changing caching semantics without verifying offline behavior.
- PWA manifest and offline shell: `manifest.json`, `offline.html`, `404.html`, `index.html` and `manifest.json` fields control app install behavior.
- Static server rules: `.htaccess` and `web.config` contain redirects, MIME types and a canonical `index.html` redirect. Keep URL-cleaning rules intact when changing paths.
- Forms / cart: `pages/store.html` contains notes that product forms submit to a hidden cart form (`/add-to-cart`) and PayPal integration is referenced in `.env` via `PAYPAL_EMAIL`. Changes to forms may affect payment flow; inspect `pages/store.html` and `products.json` first.
- Accessibility & privacy: repository explicitly disables analytics and tracking (`privacy.txt`, `.well-known/` files). Respect these constraints; do not add third-party trackers.

Developer workflows
- There is no build or test command in the repo. Typical workflow is edit -> validate HTML/CSS -> deploy static files. Check `.env` for `DEPLOY_PATH` which documents the intended deploy destination.
- For local testing: open `index.html` (or pages under `pages/`) in a browser or use a simple static file server (not committed here). Be careful with `service-worker.js` — it registers only on `https:` or `localhost`.

Where to look first for common edits
- Global styles: `assets/css/main.css`.
- Site JS: `assets/js/app.js` (service worker, live-reload helpers).
- Page templates: `pages/*.html` and root-level `index.html`, `offline.html`, `404.html`.
- Site metadata & config: `.env`, `manifest.json`, `sitemap.xml`, `opensearch.xml`.

Rules for automated edits
- Do not introduce remote third-party scripts or analytics by default.
- If adding JS/CSS, place under `assets/js/` or `assets/css/` and reference with relative paths.
- When modifying payment, cart, or checkout logic, flag it for manual review: these are safety-sensitive changes.
 - Language & style enforcement: when adding or editing UI text or documentation, use Australian English (`en-AU`) and set `<html lang="en-AU">` or `lang="en-AU"` in new/changed pages. Keep tone consistent with existing content (concise, privacy-first).

Commit message template (en-AU)
- Keep commit messages short and in Australian English. Use present-tense verbs and include the affected file(s) or area.
- Template:

	<type>(scope): short summary

	Detailed description (why), additional notes, and any manual review required.

- Example (fix):

	fix(pages/about.html): remove malformed meta characters and close head tags

	Clean up malformed markup in `pages/about.html` head. Ensures valid meta tags and correct `lang` attribute for accessibility. Verified locally.

- Example (docs):

	docs(.github/copilot-instructions.md): add en-AU language guidance and commit template

	Add explicit Australian English guidance for UI text, comments and commit messages. Include commit-message example.

Small examples (what an AI should do)
- Fix a broken meta tag: update `pages/about.html` head block to remove malformed characters and close tags correctly.
- Improve dev service-worker error handling by replacing the placeholder `catch(error => {…})` in `service-worker.js` with a minimal network-fallback response. (Make a small, well-commented change and run a browser smoke test.)

If something is unclear
- Ask a short clarifying question and reference the exact file path you inspected.

Next: request feedback on any unclear or missing sections so we can iterate.

