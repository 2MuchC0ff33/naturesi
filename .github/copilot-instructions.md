# Copilot / AI agent instructions — Nature's Infusions

Purpose: concise guidance so an AI coding agent can start work quickly in this repository.

## Big picture
- The repo currently holds a **pre‑refactor, mostly static e‑commerce site**. Changes are being rolled out in small, reversible phases.
- Static source is under `pages/`, `assets/` (CSS partials) and `js/` (runtime modules + `js/data/*.json`).
- Built artifacts land in `public_html/`; `public_html/index.php` routes through `php/bootstrap.php` which is a minimal Slim‑style bootstrap for future expansion.
- Service‑worker logic lives in `service-worker.js` with helpers in `js/modules/sw-*`.
- Phase 0 established PHP/composer bootstrap and Node tooling; later phases migrate to Slim+Plates, Sass/Open Props, HTMX/Hyperscript/Alpine.js, etc. Refer to `TODO.md` for the current roadmap.

## Developer workflows

### Setup
1. Install PHP 8.1+ and Composer, then run `composer install` in project root (this also executes the PHP bootstrap sanity check).
2. Install Node v25+ and PNPM; run `pnpm install` (all CLI examples use **pnpm** — do **not** default to `npm`).
3. Build front‑end assets:
   ```sh
   pnpm run build:css && pnpm run build:ts
   ```
   - `build:css` runs `sass`, pipes the output through PostCSS (import bundling + autoprefixer) and then invokes `node tests/check_css_build.cjs`.
   - `build:ts` invokes `tsc`; the compiler is configured by `tsconfig.json` to emit to `public_html/assets/js`.
   - A temporary intermediate file `assets/css/output.css` is created during the CSS build but is git‑ignored.

   Development watchers are available:
   ```sh
   pnpm run watch:css   # concurrently runs Sass+PostCSS with automatic rebuilds
   pnpm run watch:ts    # `tsc --watch` (see package.json)
   ```
   Use these during active editing; the `watch:css` task uses `concurrently` so a single Ctrl‑C stops both watchers.

> **Wrapper scripts:** prior phases stored helper wrappers (`pnpm-wrapper.sh`, etc.) in `tools/`, but they were migrated to `~/.local/share/wrappers` and are **not** part of the repo. Always call the npm scripts directly rather than relying on those wrappers.

### Running & configuration
- Start a quick PHP server from the repo root:
  ```sh
  php -S localhost:8000 -t public_html
  ```
  or open `public_html/index.php` in a browser. A placeholder message indicates the bootstrap is active.
- A `.env` file at the project root is parsed by `php/bootstrap.php`. Values are then available via `getenv()`, `$_ENV`, and `$_SERVER` throughout PHP. A lightweight parser is included; if `vlucas/phpdotenv` is added in the future it will be used automatically.

### Tests & validation
- `node tests/check_csaf.js` validates CSAF/provider metadata and `security.txt`.
- `node tests/check_bootstrap.cjs` verifies the bootstrap respects `.env` overrides and exports them correctly.
- Building CSS runs `node tests/check_css_build.cjs`, which fails if any `@import` remains or autoprefixer didn’t run; you can also invoke this directly using `pnpm run verify:css`.
- PHP unit tests live in `tests/BootstrapTest.php` and can be executed via `composer test` (requires phpunit). If required PHP extensions aren’t available and phpunit fails to install, simply run the JS bootstrap check as a fallback.

## Conventions & patterns
- **CSS**: `assets/css/main.css` is an ordered import list; maintain variable definitions first. Build uses PostCSS > `postcss-import` > Autoprefixer as described in `README.md`.
  * The Sass sources no longer use `@import` – everything lives under
    `assets/css/partials/` and is pulled in via `@use` with explicit
    namespaces (`settings`, `utilities`, `vendors`, etc.).  Aggregator
    partials such as `_settings.scss` and `_utilities.scss` forward their
    children so the import order remains deterministic.
  * Design tokens (colors, spacing, breakpoints) are stored in Sass maps
    (`partials/settings/_maps.scss`).  Functions like `maps.color()` and
    mixins in `partials/utilities/helpers.scss` provide a namespaced API.
    Generated `:root` custom-properties ensure runtime compatibility.
  * For new mixins or helpers, always create a dedicated module and invoke
    it via its namespace rather than polluting the global scope.  helper
    mixins live in `partials/utilities/helpers.scss` and include
    `bg-color`, `text-color`, `pad`, `margin`, `grid`, `box-shadow`,
    `fluid-type`, and `respond-to`.
  * When converting existing styles, replace `var(--token)` references with
    `maps.color(token)`/`maps.spacing(token)` or the appropriate helper.
  * Vendor CSS that cannot be converted to Sass lives under
    `partials/vendors`; once the final dependency is eliminated the
    `postcss-import` plugin can be removed and the build command
    simplified.
- **JS/TS**: Source in `ts/` compiles to `public_html/assets/js`. Runtime modules live in `js/modules`. Data files in `js/data/*.json` drive UI.
- **Service worker**: central file `service-worker.js`; registration and logic helpers in `js/modules/sw-client.js`, `sw-core.js`, `sw-handlers.js`.
- **Client storage**: cart code spans `js/cart*.js`, `storageLocal.js`, `storageIDB.js` (multiple persistence layers).
- **Routing**: mostly static pages. Avoid modifying `pages/` until later phases unless you're implementing a new Plates template.
- **Server bootstrap**: `php/bootstrap.php` is the main entry; `public_html/index.php` is a thin wrapper.

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
