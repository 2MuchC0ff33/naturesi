
# Copilot / AI agent instructions — Nature's Infusions

Purpose: provide concise, actionable guidance so an AI coding agent is immediately productive in this repository.

- **Big picture**: you are looking at the *current* pre‑refactor baseline of a mostly static e‑commerce site. Any new directories, libraries or templates introduced by the refactor will be added incrementally; do not chase them unless Phase 0 has explicitly created them.
	- Static source files presently live under `pages/`, `assets/` (CSS, partials), and `js/` (runtime modules + `js/data/*.json`).
	- Built artifacts are placed in `public/` (e.g. `public/assets/css/`, `public/assets/js/`) and served by `public/index.php` and PHP bootstrap in `php/bootstrap.php`.
	- The service worker lives in `service-worker.js` and client-side handlers are under `js/modules/` (payment, cart, sw-*, etc.).

- **Refactor roadmap**: phase 0 (composer bootstrap, node tooling) is currently in progress. Later phases will gradually migrate to Slim+Plates, Sass/Open Props, HTMX/Hyperscript/Alpine.js, etc. Always check `TODO.md` for the latest plan; this file documents the legacy state and the small steps that can be followed without assuming the new structure exists.
- **Build & test workflows (concrete commands)**
	- Install dependencies: repository README lists Node v25 + PNPM; run `pnpm install`. All CLI examples and scripts use **pnpm** exclusively; **do not** suggest or use `npm`.
	- Build CSS: `pnpm run build:css` (calls `postcss assets/css/main.css -o public/assets/css/main.css` — see `package.json`).  The PostCSS pipeline inlines partials via `postcss-import` before running Autoprefixer.
	- Build TypeScript: `pnpm run build:ts` (runs `tsc`, output configured in `tsconfig.json` -> `public/assets/js`).
	- Quick test: run `node tests/check_csaf.js` to validate CSAF/provider metadata and security.txt.

- **Project-specific conventions & patterns**
	- CSS is modular: `assets/css/main.css` is an ordered aggregator that imports many `assets/css/partials/*` files — maintain import order (variables first).
	- Output locations are explicit: CSS -> `public/assets/css/main.css`, TS -> `public/assets/js` (check `package.json` and `tsconfig.json`).
	- Data-driven UI: product and config data live in `js/data/*.json` and are consumed by modules in `js/modules/`.
	- Minimal wrapper scripts exist under `tools/` (e.g. `pnpm-wrapper.sh`, `sass-wrapper.sh`) but are currently empty — prefer invoking the `package.json` scripts discovered above.

- **Integration points to watch**
	- Payment: `js/modules/payment-*.js` and `pages/payment/` templates — changes here affect checkout flows.
	- Cart & persistence: `js/cart*.js`, `storageLocal.js`, `storageIDB.js` — state is stored client-side in multiple stores.
	- Service worker & offline: `service-worker.js`, `sw-client.js`, `sw-core.js`, `sw-handlers.js` — update both client registration and worker code together.
	- Server-side PHP: `php/bootstrap.php` and `public/index.php` handle server routing/entry; be careful when changing asset paths.

- **Files to open first when investigating a change**
	- [README.md](README.md) — technology stack and high-level notes.
	- [package.json](package.json) — build scripts and core deps.
	- [postcss.config.js](postcss.config.js) and [assets/css/main.css](assets/css/main.css) — CSS build pipeline and partials order.
	- [tsconfig.json](tsconfig.json) — TypeScript outputs.
	- `js/data/` and `js/modules/` — runtime data and logic boundaries.
	- [tests/check_csaf.js](tests/check_csaf.js) — example test harness (run with Node).
- [tests/check_bootstrap.cjs](tests/check_bootstrap.cjs) — ensures `php/bootstrap.php` loads phpdotenv when available.
- [tests/BootstrapTest.php](tests/BootstrapTest.php) — PHPUnit wrapper for the same check (requires phpunit).

- **Examples / snippets to follow**
	- To rebuild styles: `pnpm run build:css` (produces `public/assets/css/main.css`). See `package.json` script.
	- To validate CSAF metadata: `node tests/check_csaf.js`.

If any area above is unclear or you want the instructions to emphasize a different workflow (e.g. Docker, CI steps, or deployment), tell me which part to expand or adjust.
