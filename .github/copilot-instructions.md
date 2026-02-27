# Copilot / AI agent instructions — Nature's Infusions

Purpose: concise guidance so an AI coding agent can start work quickly in this repository.

## Big picture
- The repo currently holds a **pre‑refactor, mostly static e‑commerce site**. Changes are being rolled out in small, reversible phases.
- Static source is under `pages/`, `assets/` (CSS partials) and `js/` (runtime modules + `js/data/*.json`).
- Built artifacts land in `public/`; `public/index.php` routes through `php/bootstrap.php` which is a minimal Slim‑style bootstrap for future expansion.
- Service‑worker logic lives in `service-worker.js` with helpers in `js/modules/sw-*`.
- Phase 0 established PHP/composer bootstrap and Node tooling; later phases migrate to Slim+Plates, Sass/Open Props, HTMX/Hyperscript/Alpine.js, etc. Refer to `TODO.md` for the current roadmap.

## Developer workflows

### Setup
1. Install PHP 8.1+ and Composer, then run `composer install` in project root.
2. Install Node v25+ and PNPM; run `pnpm install` (all CLI examples use **pnpm** — do **not** default to `npm`).
3. Build front‑end assets:
   ```sh
   pnpm run build:css && pnpm run build:ts
   ```
   CSS appears at `public/assets/css/main.css`; TypeScript compiles to `public/assets/js` as defined in `tsconfig.json`.

> **Wrapper scripts:** earlier versions kept `pnpm-wrapper.sh` etc. in `tools/`. those were moved to `~/.local/share/wrappers` and are **not** part of the repo; invoke the npm scripts directly.

### Running & configuration
- Launch a dev server with `php -S localhost:8000 -t public` or open `public/index.php` in a browser. The placeholder message indicates phase‑0 bootstrap is working.
- A `.env` file at the repo root is parsed by bootstrapping code; values are available via `getenv()`, `$_ENV` and `$_SERVER`. If `vlucas/phpdotenv` is installed, it will be used automatically.

### Tests & validation
- `node tests/check_csaf.js` validates CSAF/provider metadata and `security.txt`.
- `node tests/check_bootstrap.cjs` ensures `php/bootstrap.php` prefers `.env` variables and exposes them correctly.
- CSS build runs `node tests/check_css_build.cjs` automatically; it fails on leftover `@import` or missing autoprefixer run.
- PHP unit tests live in `tests/BootstrapTest.php` and can be executed via `composer test` (requires phpunit). If phpunit cannot install, fallback to the JS check above.

## Conventions & patterns
- **CSS**: `assets/css/main.css` is an ordered import list; maintain variable definitions first. Build uses PostCSS > `postcss-import` > Autoprefixer as described in `README.md`.
- **JS/TS**: Source in `ts/` compiles to `public/assets/js`. Runtime modules live in `js/modules`. Data files in `js/data/*.json` drive UI.
- **Service worker**: central file `service-worker.js`; registration and logic helpers in `js/modules/sw-client.js`, `sw-core.js`, `sw-handlers.js`.
- **Client storage**: cart code spans `js/cart*.js`, `storageLocal.js`, `storageIDB.js` (multiple persistence layers).
- **Routing**: mostly static pages. Avoid modifying `pages/` until later phases unless you're implementing a new Plates template.
- **Server bootstrap**: `php/bootstrap.php` is the main entry; `public/index.php` is a thin wrapper.

## Integration hotspots
- **Checkout & payment**: `js/modules/payment-*.js` and `pages/payment/*.html` are sensitive areas.
- **Cart persistence**: updates here affect offline behaviour; test with both localStorage and IndexedDB.
- **Service worker/offline features**: changes require matching client and worker code.
- **Asset path changes**: if assets move, update `bootstrap.php`/`index.php` accordingly.

## Quick navigation
1. `README.md` – full development setup, version matrix, and background rationale.
2. `TODO.md` – detailed refactor roadmap and architecture notes.
3. `package.json` – build/test scripts and dependencies.
4. `postcss.config.js` & `assets/css/main.css` – watch import order and build pipeline.
5. `tsconfig.json` – output paths for compiled TypeScript.
6. `js/data/` & `js/modules/` – where runtime logic and configuration live.
7. `tests/` – example validation scripts and PHP unit tests.

> When in doubt, read `README.md` or `TODO.md` first; the static markup in `pages/` is intentionally untouched for now.
