# Copilot / AI agent instructions — Nature's Infusions

Purpose: quickly bring an AI coding agent up to speed on the repository's structure,
build system, and ongoing refactor strategy so that generated code fits the
project’s style and workflow.

## Big picture
- This is a **pre‑refactor, mostly static e‑commerce site** being converted in
  incremental, reversible phases. Refer to `TODO.md` for the current roadmap and
  phase‑specific instructions.
- Static source lives under `pages/`, `assets/` (Sass partials), and `js/` (runtime
  modules plus `js/data/*.json` for configuration/fixtures).  The old files are
  intentionally left untouched during migrations to maintain visual parity.
- Build artifacts and the serving root are under `public_html/`.  `public_html/index.php`
  proxies into `php/bootstrap.php`, a minimal Slim‑style bootstrap that later
  phases will expand with Slim routes and Plates templates.
- Client‑side logic is divided between traditional JS/TS (`ts/` → compiled
  output) and runtime modules (`js/modules`).  The service worker lives at the
  repo root; helpers are in `js/modules/sw-*`.
- Phase 0 introduced the PHP/composer baseline and Node tooling.  Later phases
  layer on Slim+Plates, Sass/Open Props/PicoCSS, HTMX/Hyperscript/Alpine, and
  eventually AssemblyScript→WASM.  New contributors should scan `TODO.md` to
  understand where their change lives.

## Developer workflows

### Prerequisites & setup
1. Install PHP 8.1+ (8.4+ preferred) with mysqli, curl and mbstring.  Composer is
   required for the PHP bootstrap.
2. Install Node v25+ and PNPM.  Run `pnpm install` from the repo root.  **Always**
   invoke npm tasks via `pnpm` — the legacy wrappers in `tools/` were moved to
   `~/.local/share/wrappers` and are not part of this repo.
3. After dependency installation, build frontend assets once:
   ```sh
   pnpm run build:css && pnpm run build:ts
   ```
   - `build:css` compiles `assets/css/main.scss` with Sass, feeds the result
     through PostCSS (first `postcss-import`, then autoprefixer) and runs the
     JS validation script (`tests/check_css_build.cjs`).
   - `build:ts` runs `tsc` according to `tsconfig.json`, emitting to
     `public_html/assets/js`.
   - A temporary file `assets/css/output.css` is created during CSS build and is
     intentionally git‑ignored.

   For active development use watchers:
   ```sh
   pnpm run watch:css   # Sass+PostCSS via concurrently (single Ctrl‑C stops both)
   pnpm run watch:ts    # `tsc --watch`
   ```

### Running the app locally
- A quick PHP server can be started from the project root:
  ```sh
  php -S localhost:8000 -t public_html
  ```
  Opening `http://localhost:8000` should show the bootstrap placeholder message.
- Configuration values are read from a `.env` file at the repository root.  The
  simple parser in `php/bootstrap.php` populates `getenv()`, `$_ENV` and
  `$_SERVER`; migrating to `vlucas/phpdotenv` is planned but not required.

### Tests & validation
- **CSS build check:** `node tests/check_css_build.cjs` (invoked automatically by
  `build:css` and available via `pnpm run verify:css`).  It safeguards against
  stray `@import` statements and confirms autoprefixer ran; a custom PostCSS
  plugin ensures `@charset` remains at the top of the bundle.
- **Bootstrap check:** `node tests/check_bootstrap.cjs` ensures environment
  variables from `.env` are honoured; `composer test` runs the same check via a
  lightweight PHPUnit wrapper (`tests/BootstrapTest.php`).  If phpunit cannot be
  installed (e.g. missing extensions), the JS check acts as a fallback.
- **Metadata validation:** `node tests/check_csaf.js` inspects CSAF/provider
  metadata and `security.txt` for correctness.

> Run the relevant check directly when touching related areas; the build
> scripts already wire them into the normal workflow.

## Conventions & patterns
- **CSS architecture:**
  - Entry point `assets/css/main.scss` contains only an ordered list of
    `@use` statements (namespaced, never `as *`).  Partial modules live under
    `assets/css/partials/` with subfolders for `settings`, `base`,
    `components`, `utilities` and `vendors`.
  - Tokens (colors, spacing, breakpoints) are defined in Sass maps
    (`partials/settings/_maps.scss`) with helper functions (`maps.color()`)
    and mixins in `partials/utilities/helpers.scss`.  Calling code should
    migrate off `var(--token)` in favor of these helpers; once migration is
    complete `partials/settings/variables.scss` can be deleted.
  - Vendor CSS that can't be rewritten is imported under `partials/vendors`.
    Once the last external dependency is gone, `postcss-import` can be
    removed from the build pipeline.
  - New utilities or mixins always reside in their own namespace (see
    `helpers` for existing mixins like `pad`, `btn`, `grid-responsive` etc.).

- **Javascript/Typescript:**
  - Source `.ts` files are compiled to `public_html/assets/js` via `tsconfig`.
  - Runtime modules live in `js/modules` and are consumed directly in
    `public_html` pages.  Configuration data is stored in `js/data/*.json`.

- **Service worker:**
  - Single worker script at the repo root; registration logic in
    `js/modules/sw-client.js`.  Core logic is split into `sw-core.js` and
    `sw-handlers.js`.

- **Client storage:** cart persistence is layered (`js/cart*.js`) with
  storage backends `storageLocal.js` (localStorage) and `storageIDB.js`
  (IndexedDB).  Changes here affect offline capability; testing should
  include both backends.

- **Routing & templating:**
  - Existing pages are static HTML under `pages/`.  During refactor new
    templates live in `views/` (Plates) and routes are added to
    `php/bootstrap.php`/eventual Slim router.  Avoid editing `pages/` unless a
    change cannot be accomplished through the template layer.

- **Server bootstrap:**
  - `php/bootstrap.php` is the central PHP entrypoint; it currently does litt le
    more than parse `.env` and dispatch to `public_html/index.php`, but it will
    grow Slim routes and service logic in later phases.

## Integration hotspots
- **Checkout & payment** logic is sensitive; inspect `js/modules/payment-*.js`
  and `pages/payment/*.html` when touching this area.
- **Cart persistence** – any change may break offline/online sync; verify both
  storage layers and service worker behaviour.
- **Service worker/offline features** must be updated in tandem between the
  client and the worker script to avoid mismatched caches or protocols.
- **Asset path changes** require corresponding updates to `bootstrap.php` and
  `public_html/index.php` which generate URLs for CSS/JS.

## Quick navigation
1. `README.md` – full development setup, version matrix, and background rationale.
2. `TODO.md` – the living refactor roadmap with phase‑by‑phase details.
3. `package.json` – all build/test scripts and third‑party dependencies.
4. `postcss.config.js` & `assets/css/main.scss` – examine here for CSS build
   pipeline and import order requirements.
5. `tsconfig.json` – output paths and compiler options for TypeScript.
6. `js/data/` & `js/modules/` – primary locations for runtime logic and UI data.
7. `tests/` – validation scripts and a minimal PHPUnit test.

> When in doubt, refer back to `README.md` or `TODO.md` first; the static HTML
> in `pages/` is intentionally LEFT UNTOUCHED until a refactor phase requires
> migrating it.
