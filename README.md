# Readme

## Technology Stack

### HTML

HTML Living Standard
Tidy 1:5.9.20-1+d08ddc2

### CSS

CSS Snapshot 2026

#### Pre-processor

Sass 1.97.3

#### Post-processor

PostCSS 8.5.6
Autoprefixer 10.4.27
Stylelint 17.4.0

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
[HTML Tidy Documentation](https://www.html-tidy.org/documentation/)
[PHP Manual](https://www.php.net/manual/en/)
[Composer Documentation](https://getcomposer.org/doc/01-basic-usage.md)
[JSON Schema Specification](https://json-schema.org/specification#specification-section)
[JSON Schema Documentation](https://json-schema.org/docs)
[Composer JSON Schema](https://getcomposer.org/schema.json)
[security.txt - RFC 9116 A File Format to Aid in Security Vulnerability Disclosure](https://www.rfc-editor.org/rfc/rfc9116)

## Development setup

To get up and running in a fresh clone:

1. Ensure PHP 8.1 or later is installed, along with [Composer](https://getcomposer.org/).
2. From the project root run:
   ```sh
   composer install           # installs PHP dependencies and runs bootstrap
   ```
3. Install Node.js (v25 recommended) and a package manager such as PNPM or npm.
   ```sh
   pnpm install               # or `npm install` if PNPM is unavailable
   ```
4. Build front‑end assets:
   ```sh
   pnpm run build:css && pnpm run build:ts
   ```
   The resulting CSS and JS files land in `public/assets` but do not modify any
   existing page markup. No user‑facing changes occur in Phase 0.
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
   node tests/check_bootstrap.cjs # verifies php/bootstrap.php prefers phpdotenv
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
