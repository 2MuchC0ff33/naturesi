# Readme

## Technology Stack

### HTML

HTML Living Standard
Tidy 1:5.9.20-1+d08ddc2

### CSS

CSS Snapshot 2026

#### Pre-processor

Sass 1.97.3 (installed as a local dev dependency via pnpm; `pnpm run build:css` uses the binary from `node_modules/.bin`)

#### Post-processor

PostCSS 8.5.6
Autoprefixer 10.4.27

* Build script (`pnpm run build:css`) runs PostCSS with `postcss-import` first
  (bundles `@import`‑ed partials) and then autoprefixer, producing a single
  deployable stylesheet under `public_html/assets/css/main.css`.  The input file is
  `assets/css/main.scss` which only contains an ordered list of partial imports.
  A post-build validation step (`node tests/check_css_build.cjs`) is executed
  automatically; it fails if any `@import` referencing the `partials/` tree
  remains or if autoprefixer appears not to have run. this prevents the
  disastrous case where a browser would request a missing partial and get a
  404 when `public/` is served as the document root.

### Sass module architecture

The project has migrated completely off legacy `@import` and relies on the
Sass module system (`@use` / `@forward`) for all internal styles.  Key
principles:

1. **Single entrypoint** – `assets/css/main.scss` uses named `@use`
   statements (`as settings`, `as utilities`, etc.) and never exposes the
   global namespace (`as *`).  Modules are re‑exported via a small set of
   aggregator partials (`_settings.scss`, `_utilities.scss`, `_vendors.scss`).
2. **Design tokens** – colour, spacing and breakpoint values live in
   Sass maps (`partials/settings/_maps.scss`).  Helper functions and mixins
   generate corresponding `:root` custom properties for backwards
   compatibility; gradually, callers may switch to `maps.color()`/
   `maps.spacing()` etc.
3. **Utility modules** – common mixins and helpers (e.g. `@mixin respond-to()`)
   are defined in `partials/utilities/helpers.scss` and are always invoked via
   their namespace (`@include helpers.pad(sm);`).  This keeps names scoped and
   avoids collisions during future theming work.
4. **Vendor CSS isolation** – third‑party styles that cannot be rewritten as
   Sass (currently only Open Props) are housed under `partials/vendors` and
   imported with a single `@use 'partials/vendors'` call in `main.scss`.
   Once the remaining external dependency is removed the `postcss-import`
   plugin can also be dropped.

Documentation and examples are maintained in `assets/css/README.md`.

Stylelint 17.4.0

A minimal `stylelint.config.cjs` is included in the project root so the
VS Code stylelint extension does not attempt to read `package.json` (see
error “Invalid package config” on Windows).  Customize the configuration
as needed.

### Javascript

ECMA-262 16th edition June 2025 (ECMAScript® 2025)
Typescript 5.9.3

#### Javascript Runtime

NodeJS v25.7.0

#### Package Manager

PNPM 10.30.3

### Data Serialization

#### JSON

ECMA-404 The JSON Data Interchange Standard, JSON-LD 1.1

### Web Assembly

Wasm 3.0

#### Compilation Langugae

AssemblyScript 0.28.9

### Web Server

Apache HTTPD 2.4.66

### PHP

PHP  8.4.17

#### Extension

mysqli
curl
mbstring

### Database

MariaDB 11.4.10

### Perl

Perl 5.32.1

### Redis

Redis 8.4

### Memcached

Memcached 1.6.40

## Resource

[WHATWG Standards](https://spec.whatwg.org/)
[HTML Living Standard — Last Updated 26 February 2026](https://html.spec.whatwg.org/)
[W3C standards and drafts](https://www.w3.org/TR/)
[CSS Snapshot 2026](https://www.w3.org/TR/2026/NOTE-css-2026-20260226/)
[CSS Standard](https://www.w3.org/TR/css/)
[JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)
[WebAssembly Core Specification](https://www.w3.org/TR/wasm-core-1/)
[WebAssembly JavaScript Interface](https://www.w3.org/TR/wasm-js-api-1/)
[WebAssembly Web API](https://www.w3.org/TR/wasm-web-api-1/)
[ECMA-404 The JSON Data Interchange Standard](https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf)
[ECMA-262, 16th edition, June 2025 ECMAScript® 2025 Language Specification](https://262.ecma-international.org/16.0/index.html)
[WebAssembly Specification](https://webassembly.github.io/spec/core/)
[Sass Docs](https://sass-lang.com/documentation/)
[Post CSS Documentation](https://postcss.org/docs/)
[Autoprefixer Docs](https://github.com/postcss/autoprefixer)
[The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
[Node.js v25.7.0 documentation](https://nodejs.org/docs/latest/api/)
[AssemblyScript Documentation](https://www.assemblyscript.org/introduction.html)
[Apache HTTP Server Version 2.4 Documentation](https://httpd.apache.org/docs/2.4/)
[MySQL Improved Extension](https://www.php.net/manual/en/book.mysqli.php)
[Client URL Library](https://www.php.net/manual/en/book.curl.php)
[Multibyte String](https://www.php.net/manual/en/book.mbstring.php)
[Redis Docs](https://redis.io/docs/latest/)
[Memcached Documentation](https://docs.memcached.org/)
[PNPM Docs](https://pnpm.io/pnpm-cli)
[PHP Manual](https://www.php.net/manual/en/)
[Composer Documentation](https://getcomposer.org/doc/01-basic-usage.md)
[JSON Schema Specification](https://json-schema.org/specification#specification-section)
[JSON Schema Documentation](https://json-schema.org/docs)
[Composer JSON Schema](https://getcomposer.org/schema.json)
[security.txt - RFC 9116 A File Format to Aid in Security Vulnerability Disclosure](https://www.rfc-editor.org/rfc/rfc9116)
[Slim Micro-Framework](https://www.slimframework.com/docs/v4/)
[Plates](https://platesphp.com/)
[Open Props](https://open-props.style/#getting-started)
[PicoCSS](https://picocss.com/docs)

## Development setup

To get up and running in a fresh clone:

1. Ensure PHP 8.1 or later is installed, along with [Composer](https://getcomposer.org/).
2. From the project root run:
   ```sh
   composer install           # installs PHP dependencies and runs bootstrap
   ```
3. Install Node.js (v25 recommended) and PNPM (this project requires it).
   ```sh
   pnpm install
   ```
4. Build front‑end assets:
   ```sh
   pnpm run build:css && pnpm run build:ts
   ```
   The first command runs `sass` against `assets/css/main.scss`, writes a
   temporary `assets/css/output.css`, then pipes that through PostCSS
   (import bundling + autoprefixer) to produce `public_html/assets/css/main.css`.
   You can also launch a continuous watcher for development; the script now
   uses `concurrently` so both the Sass and PostCSS watchers start together and
   a single Ctrl‑C will shut them both down cleanly:
   ```sh
   pnpm run watch:css
   ```
   The resulting CSS and JS files land in `public/assets` but do not modify any
   existing page markup. The intermediary `assets/css/output.css` file is
   generated during the build for local debugging but is **not** tracked in
   source control (see `.gitignore`). No user‑facing changes occur in Phase 0.
5. (Optional) if you create a `.env` file at the project root, it will be
   parsed during bootstrap and the values become available via `getenv()`,
   `$_ENV` and `$_SERVER`. A simple parser is included so no additional
   dependencies are required; `vlucas/phpdotenv` will be used automatically if
   installed later.
6. Verify the bootstrap working by opening `public/index.php` in a browser or
   running `php -S localhost:8000 -t public` and visiting
   `http://localhost:8000`. You should see the placeholder message.
7. A quick sanity check script is provided (run from the repository root):
   ```sh
   node tests/check_csaf.js       # validates CSAF/security.txt metadata
   node tests/check_bootstrap.cjs # verifies php/bootstrap.php prefers phpdotenv and makes values available via getenv()
   ```

   You can also execute the PHP unit test via Composer after installing dev
   dependencies:
   ```sh
   composer install --dev
   composer test       # runs phpunit on tests/BootstrapTest.php
   ```
   If the required PHP extensions aren't installed (xmlwriter, tokenizer, etc.)
   Composer may be unable to install phpunit and `composer test` will simply
   print a message and exit.  In that case fall back to the JavaScript check:
   ```sh
   node tests/check_bootstrap.cjs
   ```

> The `pages/` directory still contains the original static HTML; we won’t
> touch those files until later phases.


## Contributing

Contributions are welcome!  Please read [CONTRIBUTING](CONTRIBUTING) for
workflow instructions and be sure to review and agree to the
[Contributor License Agreement](CLA.md) or include a Developer Certificate of
Origin sign-off in your commits.

> **Editor configuration:** To avoid committing machine‑specific paths,
> shared repository settings are stored in `.vscode/settings.json` only. If you
> need a custom terminal profile (for Cygwin, WSL, etc.) or other local tweaks,
> create a file called `.vscode/settings.local.json` and add it to your global
> `.gitignore` (a sample is included in the repo). The local file overrides any
> settings in the tracked config and is never checked in by default. See the
> `assets`/ `js`/ or `README` for examples on how to keep personal config
> separate.
