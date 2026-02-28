# Todo

## Unified Architecture & Refactor Roadmap

**Goal:** Convert the existing static site into a mobile‑first, progressive‑enhancement PWA using **Slim + Plates**, **Sass + Open Props**, **HTMX + Hyperscript**, **limited Alpine.js**, and **PDO first → selective Doctrine later**, with optional **AssemblyScript → WASM** for heavy client logic. Each step is small, testable, and reversible.

***

### 1) North‑Star Architecture (Mobile‑First, Static‑Lean PWA)

#### 1.1 Front end

**Templating**

*   **Slim Framework + Plates** for clean routes and server‑rendered templates.
*   Plates partials and HTMX fragments for page shells and dynamic regions.
*   Pages remain statically linkable and indexable.

**Progressive enhancement stack**

*   **HTMX** for dynamic PLP filters, pagination, mini‑cart, and inline validation.
*   **Hyperscript** for micro‑behaviours (loading states, toasts, toggles).
*   **Alpine.js (limited use)** for interactive widgets too complex for Hyperscript:
    *   Variant switchers
    *   Dropdowns with keyboard support and ARIA
    *   Components with live states not suitable for `hx-sync`
*   **TypeScript** for structured client logic. Use esbuild or Rollup for a light bundle.
*   **AssemblyScript → WebAssembly (mandatory for heavy logic, lazy‑loaded)**:
    *   Pricing and discount engine
    *   Variant matching
    *   Local search and scoring
    *   Heavy cart maths
        Provide a graceful JS fallback.

**CSS**

*   **Sass architecture** (components, utilities, tokens).
*   **Open Props** globally for:
    *   Colour system and gradients
    *   Spacing and typography scales
    *   Shadows, easing curves, and animations
*  **PicoCSS** globally for:
    *   Base typographic styles, lightweight form controls, and accessible components.
    *   Rapid prototyping and a minimal reset layer so custom tokens and utilities can override.
    *   Imported as a foundational base (import pico first), with overrides applied via Open Props and project Sass.
*   PostCSS + Autoprefixer.
*   Tokens exposed via CSS Custom Properties.
*   Optional: CSS Typed OM + Properties & Values API, CSS Font Loading API.

**PWA**

*   Service Worker offline shell + caching.
*   Web App Manifest.

**Client storage**

*   IndexedDB for offline cart and product deltas.
*   LocalStorage / SessionStorage for UI preferences.
*   StorageManager for quota handling.

**Performance & UX Web APIs**

*   IntersectionObserver, ResizeObserver
*   View Transition API, Web Animations API
*   Device Memory API, Network Information API
*   Page Visibility API
*   Pointer Events, Picture‑in‑Picture, Screen Wake Lock

**Notifications & background**

*   Background Sync API
*   Periodic Background Sync (optional)
*   Push API + Notifications API

**Checkout‑specific**

*   Payment Request API
*   Credential Management API
*   WebAuthn
*   Clipboard API
*   HTML Sanitizer API

***

#### 1.2 Back end (Apache + Slim + Plates + PHP‑FPM)

*   **Slim Framework** for routes and REST‑like endpoints.
*   **Plates** for server‑rendered HTML fragments and pages.
*   **PDO first** for lean, handcrafted SQL.
    **Doctrine later (selective)** for richer domain models and migrations where it adds value.
*   **MariaDB** as system of record.
*   **Redis** for sessions, fragment caching, and rate‑limiting.
*   **Memcached** for edge fragment caching.
*   **Apache 2.4** with Brotli, clean URLs, and PHP‑FPM.

**Data flows enhanced by modern Web APIs**

*   Fetch API with clear network semantics.
*   Streams API for streamed PLP loading.
*   Compression Streams API for catalog deltas.

***

### 2) Incremental Refactor Roadmap

> Each phase includes files, actions, and outcomes. Phases aim for visual parity first, then controlled enhancements. All changes are reversible.

#### Phase 0 — Baseline & Guardrails (Week 1)

> **Note:** Local helper scripts (`*-wrapper.sh`) have been moved out of the repository to `~/.local/share/wrappers` and consolidated into a single `windows-executable-wrapper.sh` with symlinks in `~/.local/bin`. The `tools/` directory no longer contains those wrappers.
>
> The unified wrapper has since been expanded to cover additional Windows executables (`ssh`, `python`, `go`, `shellcheck`) using the same dispatch mechanism; corresponding symlinks were created in `~/.local/bin`. All scripts are written with shellcheck‑friendly quoting and `exec` calls to eliminate lint warnings.


**Files**

*   `composer.json`
*   `public/index.php` (bootstrap placeholder)
*   Keep existing static pages untouched.
*   `package.json`, `tools/` for build helpers
*   `tsconfig.json`, `postcss.config.js`

**Actions**

*   Set up reproducible dev build environment.
*   Do not alter UI or behaviours.

**Outcome**

*   Composer + PHP bootstrap in place.
*   Node build tooling ready; no user‑facing change.

***

Here is the **combined, paste‑ready** Phase 1 snippet for your `TODO.md`, merging the detailed plan with the small, actionable task list. Australian English; no contractions.

***

#### Phase 1 — Sass + Open Props + PicoCSS & Plates/Slim (Weeks 1–2)

**TL;DR**
Convert the static CSS to a Sass‑first workflow, add Open Props tokens and PicoCSS, and introduce Slim + Plates for server‑rendered templates. Update build scripts and tests, refactor pages into Plates, and serve a small set of pilot routes via Slim while keeping static fallback.

***

##### Files & Structure

*   Rename `assets/css/main.css` → `assets/css/main.scss`.
*   Create `assets/css/partials/` and migrate partials to `.scss` in logical layers:
    *   `settings/`, `tools/`, `base/`, `components/`, `utilities/`.
*   Add token mapping partial `assets/css/partials/_tokens.scss` (imports Open Props and exposes project variables).
*   Add `views/`:
    *   `views/layout.php` (HTML skeleton and asset links).
    *   `views/partials/` (`head_meta.php`, `header.php`, `footer.php`).
    *   `views/pages/` (Plates versions of current static pages).
*   Keep original static HTML under `pages/` temporarily for visual parity checks.

***

##### Task Breakdown (Small, Sequential Tasks)

###### 1) Tooling Setup

*   Add dependencies via pnpm: `open-props`, `@picocss/pico`, and the Sass CLI (`sass`) as a dev dependency. This ensures builds work on CI and fresh clones.
*   Update `package.json`:
    *   Add `build:css` script (sass → PostCSS → Autoprefixer → `check_css_build.cjs`).
    *   Add `watch:css` script using `concurrently` to run Sass and PostCSS watchers together.
*   Ensure `postcss-import` runs **before** Autoprefixer in `postcss.config.js` and document the order in comments.
*   Add Autoprefixer targets via `.browserslistrc` or `package.json#browserslist`.
*   Confirm PostCSS pipeline still writes the temporary `assets/css/output.css` (gitignored) if applicable.
*   Update `check_css_build.cjs` to validate SCSS output rules (no legacy `@import` in final CSS, expected tokens present).

###### 2) Convert CSS → Sass

*   Rename `assets/css/main.css` → `assets/css/main.scss`.
*   Replace CSS `@import url(...)` calls with Sass `@use`/`@forward` (or interim Sass `@import` during migration).
*   Create/confirm `assets/css/partials/` all subfolders.
*   Convert existing partials to `.scss`.
*   Create `_tokens.scss` that imports Open Props and exposes project variables (CSS custom properties and/or Sass variables).
*   Add documentation comments at top of each partial describing purpose and import order.
*   Update `check_css_build.cjs` to accept SCSS build and to assert no `@import` remains in the emitted CSS.

###### 3) Integrate PicoCSS + Open Props

*   In `main.scss`, import in this order:
    1.  PicoCSS
    2.  Open Props
    3.  `_tokens.scss`
    4.  Project partials (settings → base → components → utilities)
*   Confirm PicoCSS utilities are present and overrideable via custom properties.
*   Confirm Open Props variables compile and appear as CSS custom properties.
*   Add a TODO for potential `postcss-jit-props` adoption later if desired.

###### 4) Slim + Plates Framework Setup

*   Add Composer dependencies: `slim/slim`, `league/plates` and run `composer install`.
*   Create `views/` with:
    *   `views/layout.php`
    *   `views/partials/head_meta.php`
    *   `views/partials/header.php`
    *   `views/partials/footer.php`
    *   `views/pages/` for page templates
*   Update `bootstrap.php`:
    *   Instantiate Slim app (`AppFactory::create()`).
    *   Add routing and error middleware.
    *   Instantiate `Plates\Engine` with `__DIR__ . '/../views'` and register helpers (for example `asset`, `uri`).
*   Update `public/index.php` to route requests through Slim.
*   Add pilot routes: `/`, `/about`, `/store`.
*   Configure fallback so unmatched routes can still serve static files (for example Slim notFound handler serving from `pages/` where appropriate).

###### 5) Refactor Static HTML Pages → Plates Templates

*   For each file in `pages/`:
    *   Move body content into `views/pages/*`.
    *   Use Plates section/yield where appropriate (for example `$this->section('content')`).
    *   Replace hardcoded asset paths with helper calls (for example `$this->asset('js/app.js')`).
*   Keep original static HTML in `pages/` until visual parity is confirmed.

###### 6) Testing & Validation

*   Extend `check_bootstrap.cjs` to detect Slim + Plates initialisation or environment flags.
*   Add/update a simple PHP test (for example `BootstrapTest.php`) to assert Slim responds to pilot routes.
*   Ensure SCSS build tests verify:
    *   No `@import` leakage in output CSS.
    *   Vendor prefixes present.
    *   Open Props tokens present where expected.
*   Run Stylelint or existing CSS validation.

###### 7) Documentation

*   In `TODO.md` under Phase 1, list references to Sass, PostCSS, Autoprefixer, Open Props, PicoCSS, Slim, Plates, pnpm, Composer, and JSON Schema resources used.
*   Optionally add `docs/phase1.md` outlining:
    *   Sass workflow
    *   Build commands
    *   Directory structure
    *   Slim + Plates overview
*   Update `README.md`:
    *   Note Sass is now part of the workflow.
    *   Add CSS build steps and dev server instructions.
    *   Update developer setup for PHP + pnpm.

###### 8) Verification

*   Run `pnpm install` then `pnpm run build:css`; confirm no errors.
*   Run `pnpm run watch:css`; confirm live recompilation works when editing partials and that Ctrl‑C stops both processes.
*   Run `composer install`; confirm Slim and Plates autoload.
*   Launch dev server:
    *   `php -S localhost:8000 -t public`
*   Verify:
    *   Plates homepage renders at `http://localhost:8000/`.
    *   Visual parity with legacy `pages/index.html`.
    *   Static fallback still works for direct navigation where intended.
*   Inspect built CSS:
    *   PicoCSS base styles present.
    *   Open Props custom properties present.
*   Confirm templates exist in `views/` and static markup has been removed or flagged for deletion.
*   Linting and style checks still pass.

***

##### CSS Migration Details

*   Replace legacy CSS imports with Sass `@use`/`@forward` where possible; use interim Sass `@import` only as a temporary step.
*   Recommended compile order in `main.scss`:
    1.  PicoCSS
    2.  Open Props
    3.  Project partials (tokens/settings → base → components → utilities)
*   Keep `postcss-import` only if required for third‑party CSS resolution (for example Pico path); otherwise rely on Sass resolution.

***

##### Slim & Plates Notes

*   `bootstrap.php`:
    *   Create Slim app, add routing and error middleware.
    *   Configure Plates engine pointing at `views/`, register `asset` and `uri` helpers.
*   `public/index.php`:
    *   Route all requests through Slim.
    *   NotFound handling can serve static files where required during transition.
*   Pilot routes: `/`, `/about`, `/store`.

***

##### Decisions

*   **Sass syntax**: Prefer `@use`/`@forward` for modularity; avoid legacy `@import`.
*   **Build order**: Compile with Sass first, then PostCSS/Autoprefixer; ensure `postcss-import` precedes Autoprefixer if retained.
*   **Templating fallback**: Retain original `pages/` HTML until Slim/Plates routes are stable in a later phase.
*   **Package manager**: Continue with pnpm; adjust scripts rather than switching to npm.

***

##### Ready‑to‑run Checks

*   `pnpm run build:css` completes without errors; output `assets/css/main.css` (or configured path) contains vendor prefixes and no `@import`.
*   `pnpm run watch:css` rebuilds on editing `assets/css/partials/*` (verify both watchers exit together).
*   `composer install` completes; Slim and Plates available.
*   `php -S localhost:8000 -t public` serves Plates‑templated homepage with visual parity.

***

#### Phase 2 — HTMX + Hyperscript + Limited Alpine.js (Weeks 2–3)

**Files**

*   Include **HTMX** and **Hyperscript** (CDN for pilot, bundle later).
*   `src/Controller/*` HTMX endpoints for PLP filters, pagination, mini‑cart.
*   Optional Alpine component files for complex widget.

**Actions**

*   Convert one PLP component to HTMX (server‑driven fragment rendering).
*   Add Hyperscript micro‑behaviours (loading states, toasts, toggles).
*   Use **Alpine.js only** where HTMX/Hyperscript is insufficient:
    *   Example: variant selector with keyboard support and ARIA.

**Outcome**

*   Dynamic interactions with graceful fallbacks to full page loads.
*   Accessibility improved for complex widgets.

**APIs enabled**

*   IntersectionObserver
*   View Transition API
*   Pointer Events
*   Page Visibility API

***

#### Phase 3 — Offline, Storage, Sync (Weeks 3–4)

**Files**

*   Keep existing `service-worker.js`, `manifest.json`, `sw-core.js`
*   `assets/js/storageIDB.js` for IndexedDB migrations

**Actions**

*   Ensure SW scope matches `public/` routing under Slim.
*   Test offline shell and background sync endpoints.
*   Migrate cart to IndexedDB with deltas.

**Outcome**

*   Reliable offline UX and background sync working with Slim endpoints.

***

#### Phase 4 — Server Caching, Middlewares, DB Indexing (Weeks 4–5)

**Files**

*   Slim middleware: caching, auth, compression
*   `public/.htaccess` for clean URLs and Brotli
*   SQL indices where needed

**Actions**

*   Add Slim middlewares (ETag/Cache‑Control, compression, basic auth if needed).
*   Optimise PDO queries and DB indices for PLP and cart endpoints.
*   Wire Redis fragment cache; Memcached at the edge where available.

**Outcome**

*   Lower latency, reduced load, measurable cost/perf gains.

***

#### Phase 5 — Checkout Hardening (Weeks 5–6)

**Files**

*   Move HTMX validation endpoints into Slim controllers
*   Security headers and sanitisation rules

**Actions**

*   Harden checkout flows:
    *   Server‑side validation
    *   HTML Sanitizer API
    *   CSRF defences in Slim
    *   Strengthen error handling

**Outcome**

*   Stable, secure checkout with robust validation.

***

#### Phase 6 — TypeScript Domain + AssemblyScript → WASM (Weeks 6–7)

**Files**

*   `src/wasm/` AssemblyScript modules (e.g., pricing)
*   `assets/ts/wasm-loader.ts` (Alpine‑friendly snippet if needed)
*   JS fallback for the same domain logic

**Actions**

*   Compile and lazy‑load at first use (e.g., first cart calculation).
*   Route to WT (WASM) when supported, fallback to JS seamlessly.
*   Keep logic deterministic and testable.

**Outcome**

*   Heavy compute offloaded to WASM with graceful degradation.

***

#### Phase 7 — Polish, Observability, Security (Ongoing)

**Actions**

*   Linting, formatting, minifying, OWASP hardening.
*   Lighthouse budget gates.
*   Optional: Sentry or lightweight logging hooks.
*   Add CI tasks for build, unit tests, and smoke tests.

**Outcome**

*   Production‑grade stability and visibility.

***

### 3) Verification & Quality Gates

**Visual/regression**

*   Before each phase, take baseline screenshots of key pages.
*   After each phase, compare parity and note intentional diffs.

**Build checks**

*   `pnpm run build:css` produces expected `main.css`.
*   `pnpm run build:ts` compiles TypeScript without warnings.

**HTMX endpoints**

*   Inspect request/response for PLP filters and verify DOM swaps and history.

**PWA**

*   Site loads offline; `offline.html` served where appropriate.
*   SW update flow shows an update banner.

**DB**

*   Smoke test cart sync endpoint; verify MariaDB persistence.
*   Confirm Redis sessions and fragment caching where configured.

**Performance**

*   Track TTFB, FCP, INP, and memory via browser devtools and Lighthouse.
*   Confirm Brotli, ETag, and caching headers.

***

### 4) Technical Decisions (Confirmed)

*   **Server layer:** `slim/slim` + `league/plates`
*   **Client enhancement:** HTMX + Hyperscript (CDN pilot → bundle later if required)
*   **Widgets:** Limited Alpine.js for complex UI only
*   **DB access:** Start with **PDO**; introduce **Doctrine** selectively for domains that benefit from repositories, entities, and migrations
*   **Design tokens:** Open Props via npm; expose tokens as CSS Custom Properties
*   **Bundling:** Prefer light tooling (esbuild/Rollup)
*   **Caching:** Redis (sessions, fragments), Memcached (edge), Apache Brotli

***

### 5) Directory Layout (Illustrative)

    /public
      index.php
      .htaccess
      assets/
        css/ (compiled)
        js/
        images/
      sw.js
    /src
      Controller/
      Repository/
      Domain/
      Middleware/
      wasm/            # AssemblyScript sources
    /views
      layout.php
      partials/
      pages/
    /tools
    composer.json
    package.json
    postcss.config.js
    tsconfig.json

***

### 6) Example PNPM Scripts (Illustrative)

```json
{
  "scripts": {
    "build:css": "sass assets/css/main.scss public/assets/css/main.css --no-source-map && postcss public/assets/css/main.css -o public/assets/css/main.css",
    "watch:css": "pnpm exec concurrently --kill-others \"sass --watch assets/css/main.scss:public/assets/css/main.css\" \"postcss --watch public/assets/css/main.css -o public/assets/css/main.css\"",
    "build:ts": "esbuild assets/ts/index.ts --bundle --format=esm --outdir=public/assets/js --sourcemap",
    "watch:ts": "esbuild assets/ts/index.ts --bundle --format=esm --outdir=public/assets/js --sourcemap --watch",
    "dev": "php -S localhost:8080 -t public"
  },
  "dependencies": {
    "open-props": "^1.7.6"
  },
  "devDependencies": {
    "sass": "^1.77.0",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.18",
    "esbuild": "^0.20.2"
  }
}
```

***

### 7) Risk & Rollback

**Key risks**

*   Scope creep in Alpine widgets.
    *Mitigation:* limit Alpine to named components; prefer HTMX/Hyperscript.
*   Doctrine complexity early.
    *Mitigation:* start with PDO; introduce Doctrine only for complex aggregates.
*   SW cache invalidation edge cases.
    *Mitigation:* versioned assets, update banners, cache‑busting strategy.
*   WASM portability.
    *Mitigation:* strict JS fallback, feature detection, e2e tests on target browsers.

**Rollback**

*   Each phase introduces additive files and routes; retain prior static templates for quick reversion.
*   Keep `feature/*` branches per phase; merge only after passing quality gates.

***

### 8) Acceptance Criteria per Phase (Summary)

*   **Phase 1:** Plates templates render 8 pilot pages with tokenised CSS; visual parity.
*   **Phase 2:** One PLP area drives via HTMX with graceful fallback; complex widget in Alpine with ARIA.
*   **Phase 3:** Offline shell works; cart persists in IndexedDB; background sync verified.
*   **Phase 4:** Redis fragment caching in place; measurable latency drop on PLP endpoints.
*   **Phase 5:** Checkout validations moved to Slim; sanitisation and CSRF verified.
*   **Phase 6:** Pricing module runs via WASM where supported; JS fallback equivalent.
*   **Phase 7:** Lighthouse passes budgets; security headers and OWASP checks green.

***

### 9) Assumptions

*   PHP‑FPM, Apache 2.4 with Brotli are available in the target environments.
*   MariaDB and Redis are available; Memcached is optional.
*   A prior service worker exists and can be adapted to the new `public/` scope.
*   WASM can be introduced progressively without blocking release timelines.
*   Doctrine is optional and will be applied only when its benefits exceed its overhead.

***

### 10) Rationale Summary

*   **Small, reversible steps** reduce risk and enable fast verification.
*   **Server‑driven HTMX** keeps complexity low and accessibility high while retaining SEO.
*   **Sass + Open Props** standardises tokens for fast, controlled theming without heavy CSS frameworks.
*   **PDO first** preserves speed and clarity, while **selective Doctrine** enables richer domains where warranted.
*   **WASM for heavy compute** improves responsiveness for calculations while preserving a JS fallback.

**Confidence:** High for Phases 0–5, Medium for Phase 6 (WASM) due to browser variations and integration details.
