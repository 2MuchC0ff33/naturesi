h44019
s 00109/00000/00000
d D 1.1 26/04/12 13:56:43 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:43 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
# Nature's Infusions POSIX-First E-Store

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Privacy First](https://img.shields.io/badge/privacy-first-green.svg)](privacy.txt)

## Overview

A privacy-first, static e-commerce store for Nature's Infusions. Built using only HTML5, CSS3, vanilla JavaScript, and strict POSIX shell automation. No build steps, package managers, frameworks, or non-portable tooling. Designed for accessibility, transparency, and complete auditability.

---

## Project Philosophy

- **POSIX-Only Tooling**: All tests, linting, and automation scripts are pure POSIX shell (`sh`, `awk`, `sed`, `jq`, etc.). No Node.js, npm, or non-POSIX shells required.
- **No Build Step**: Truly static; everything renders on standard web servers with no transpilation or bundling.
- **Data Transparency**: Products, config, and environment are human-readable and clearly versioned.
- **Accessibility & Privacy**: Semantic HTML, no trackers/analytics, high a11y standards.
- **Conservative Git Workflow**: Commits and PRs only on dedicated feature/integration branches (never directly on `main`). See [`AGENTS.md`](AGENTS.md) for strict git hygiene, squash, and branch removal policies.

---

## Tree Structure

- `pages/` — All top-level pages and store subpages
- `assets/` —
  - `css/` & `css/partials/` — Modular CSS (with block comment policy)
  - `js/` — Vanilla JS modules only; ES6, no bundler
  - `js/data/` — Canonical product data (CSV/JSON)
  - `img/` — Images (WebP/PNG, high-efficiency)
- `data/` — Flat .txt/.csv config for products, shipping, etc.
- `partials/` — Small .txt content snippets used for static HTML includes
- `scripts/` — Maintenance/test shell scripts (all /bin/sh, never bash)
- `test/` —
  - `smoke/`, `unit/`, `headless/`, `e2e/` — Full test suite (see below)

---

## Testing

All tests are written as portable POSIX shell scripts:

- `test/smoke/` — Static file structure, key content, a11y checks
- `test/unit/` — Logic and business rule validation (POSIX, jq, bc, awk)
- `test/headless/` — Chromium headless browser: DOM, localStorage, PWA
- `test/e2e/` — Full checkout and cart flows

**Run all tests:**

```sh
scripts/test-all.sh             # Lint + all tests (headless requires apache2 & chromium)
scripts/test-headless.sh        # Only headless browser tests
scripts/lint-shellcheck.sh      # Lint all scripts
scripts/lint-html.sh page.html  # HTML lint
scripts/lint-css.sh file.css    # CSS lint
```

**Requirements:**

- `chromium` required for headless (not PhantomJS)
- All scripts: `/bin/sh` only, no Bash, no Node

---

## Data and Configuration

- `.env.template` — Canonical template for required keys; never commit secrets
- All sensitive config/environment is `.env`, never versioned
- See AGENTS.md for environment variable and deploy conventions

---

## Git & Contribution Workflow

**Strict branching, squash, and PR rules:**

- All edits/commits made on dedicated feature or integration branches
- Use worktrees for parallel development; never develop on `main`
- Always squash and PR/merge via feature/integration, never directly to `main`
- Clean up obsolete branches/worktrees after merge
- See [`AGENTS.md`](AGENTS.md) for full mandatory rules and advanced git patterns (interactive rebase, cherry-pick, bisect, reflog, etc.)

**Quick Start:**

```sh
git checkout -b feat/my-feature    # Always start new branch
# ... make changes ...
git add ... && git commit -m 'feat(scope): concise summary'
git push -u origin feat/my-feature # PR/squash/merge via review
```

---

## Local Development

- Run `scripts/serve.sh start` to launch Apache for local dev
- Hot reload: `scripts/watch.sh &` (touches reload.txt for browser polling)
- Use only standard UNIX/POSIX tools for any data/scripts

---

## License & Contact

- MIT License — see [LICENSE](LICENSE)
- Authors: credited in site footer
- Payment/cart support: [2MuchC0ff33@example.org](mailto:2MuchC0ff33@example.org) (update before deploy)

---

For full developer guidance, see [`AGENTS.md`](AGENTS.md) and all referenced shell scripts, lint/test harnesses, and POSIX-first documentation. This project values maintainability, auditability, and simplicity above all else.
E 1
