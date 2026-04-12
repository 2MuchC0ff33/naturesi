# TODO — Nature's Infusions Infrastructure

**Branch:** feature/static-first  
**Goal:** Comprehensive infrastructure improvement, POSIX migration, headless testing, flat-file data  
**Status:** COMPLETED — All 10 phases done (Phases 6 & 7 added in session 2), 49/49 tests pass, ready to squash-merge

---

## ⚡️ NEW: MAKEFILE-AUTOMATION PHASE — POSIX Audit, SCCS, Checksums, Patch

- [x] Scaffold SCCS/, .checksums/, .patches/ directories
- [x] Created Makefile (POSIX/agent-ready): sccs-init, checksums, patches, validate-audit, lint, test, validate
- [x] Documented infra in .opencode/README.md, .opencode/skills/README.md, AGENTS.md, TODO.md
- [x] Ran full SCCS/checksums/patch/validate flow (all pass)
- [ ] Integrate as agent/human workflow/pre-commit default for all infra and doc changes

## Phase 1 — POSIX + ShellCheck Foundation + Fix Failing Tests ✅

### 1.1 — Change all shebangs to #!/bin/sh

- [x] scripts/lint-shellcheck.sh (NEW — POSIX wrapper for shellcheck -s sh -S warning)
- [x] scripts/lint-shell.sh (UPDATE — add shellcheck as step 0)
- [x] scripts/test-all.sh (UPDATE shebang)
- [x] scripts/test-one.sh (UPDATE shebang)
- [x] All 20 scripts in scripts/ (UPDATE shebangs)
- [x] All 25 test files in test/smoke/ and test/unit/ (UPDATE shebangs)

### 1.2 — Fix non-POSIX scripts

- [x] process_html.sh (convert bash arrays → while-read, #!/bin/sh)
- [x] generate-product-grids.sh (replace ${RANDOM} with awk random)
- [x] lint-shell.sh (UPDATE — remove [[ check, update #!/bin/sh)

### 1.3 — Integrate ShellCheck

- [x] Create scripts/lint-shellcheck.sh
- [x] Add as step 0 of lint-shell.sh
- [x] Fix all SCxxxx errors found

### 1.4 — Fix 2 failing test bugs

- [x] test/smoke/css-vars.test.sh (grep -oE → grep -oE --)
- [x] test/smoke/seo.test.sh (sed normalize before meta description grep)

### 1.5 — Verify

- [x] scripts/test-all.sh → 25/25 pass (later 49/49)
- [x] scripts/lint-shellcheck.sh → 0 errors

---

## Phase 2 — AWK / SED / JQ / BC Standalone Scripts

### 2.1 — scripts/awk/

- [ ] scripts/awk/extract-css-vars.awk
- [ ] scripts/awk/csv-stats.awk
- [ ] scripts/awk/css-complexity.awk
- [ ] scripts/awk/js-metrics.awk
- [ ] scripts/awk/check-links.awk
- [ ] scripts/awk/json-report.awk
- [ ] Commit: feat(scripts): add awk scripts

### 2.2 — scripts/sed/

- [ ] scripts/sed/normalize-meta.sed
- [ ] scripts/sed/strip-css-comments.sed
- [ ] scripts/sed/strip-js-comments.sed
- [ ] scripts/sed/extract-urls.sed
- [ ] scripts/sed/dedupe-css-rules.sed
- [ ] Commit: feat(scripts): add sed scripts

### 2.3 — scripts/jq/

- [ ] scripts/jq/validate-products.jq
- [ ] scripts/jq/summarize-products.jq
- [ ] scripts/jq/extract-categories.jq
- [ ] scripts/jq/enrich-cart.jq
- [ ] scripts/jq/build-nav.jq
- [ ] scripts/jq/lint-data.jq
- [ ] Commit: feat(scripts): add jq scripts

### 2.4 — scripts/bc/

- [ ] scripts/bc/shipping-calc.bc (with self-test)
- [ ] scripts/bc/price-total.bc (with self-test)
- [ ] scripts/bc/tax-calc.bc (with self-test)
- [ ] scripts/bc/price-breakdown.bc (with self-test)
- [ ] Commit: feat(scripts): add bc scripts

---

## Phase 3 — Improved HTML + CSS Linting

### 3.1 — Upgrade lint-html.sh

- [ ] Add: duplicate ID detection (awk)
- [ ] Add: heading hierarchy h1→h2→h3 (awk)
- [ ] Add: HTML5 semantic elements (grep)
- [ ] Add: data-\* attribute validity (grep)
- [ ] Add: required attribute on inputs (grep)
- [ ] Add: autocomplete on form fields (grep)
- [ ] Add: noscript fallback on scripts (grep)
- [ ] Add: viewport maximum-scale abuse (grep)

### 3.2 — Upgrade lint-css.sh

- [ ] Add: unused CSS classes vs HTML (awk)
- [ ] Add: duplicate property declarations (awk)
- [ ] Add: specificity warnings — id selectors (awk)
- [ ] Add: z-index conflicts (awk)
- [ ] Add: missing fallback fonts (grep)
- [ ] Add: color contrast hints (awk)
- [ ] Add: flex/grid gap fallbacks (grep)

### 3.3 — Create new lint scripts

- [ ] scripts/lint-html-full.sh (full HTML lint)
- [ ] scripts/lint-css-full.sh (full CSS lint)
- [ ] scripts/lint-a11y.sh (expanded accessibility)
- [ ] scripts/lint-data.sh (lint all .json, .csv, .txt data files)
- [ ] Commit: feat(lint): expand HTML and CSS linting with new checks

---

## Phase 4 — Headless Browser Testing (Chromium)

### 4.1 — Test runner

- [ ] Create scripts/test-headless.sh (POSIX wrapper, checks chromium availability)
- [ ] Create test/headless/ directory
- [ ] scripts/test-headless.sh → verify chromium available, skip with WARN if not

### 4.2 — Layer 1: file:// smoke (no server needed)

- [ ] test/headless/site-smoke.test.sh (load every HTML page, no crash)
- [ ] test/headless/dom-structure.test.sh (key DOM elements exist)

### 4.3 — Layer 2: localhost (requires apache running)

- [ ] test/headless/cart-render.test.sh
- [ ] test/headless/cart-add.test.sh
- [ ] test/headless/checkout-form.test.sh
- [ ] test/headless/paypal-redirect.test.sh
- [ ] test/headless/payment-success.test.sh
- [ ] test/headless/payment-cancel.test.sh
- [ ] test/headless/shipping-estimate.test.sh
- [ ] test/headless/product-add-flow.test.sh
- [ ] test/headless/service-worker.test.sh
- [ ] test/headless/modal.test.sh
- [ ] test/headless/search.test.sh

### 4.4 — Verify

- [ ] Start apache: scripts/serve.sh start
- [ ] scripts/test-headless.sh → all pass
- [ ] Stop apache: scripts/serve.sh stop
- [ ] Commit: feat(headless): add chromium headless browser tests

---

## Phase 5 — Cart + Checkout + Payment Tests

### 5.1 — POSIX shell tests (no JS execution)

- [ ] test/unit/checkout-form-structure.test.sh
- [ ] test/unit/paypal-urls.test.sh
- [ ] test/unit/shipping-zone.test.sh (awk + mock postcode data)
- [ ] test/unit/shipping-bc.test.sh (bc output vs expected)
- [ ] test/unit/shipping-weight-bc.test.sh (bc price-total)
- [ ] test/unit/deleted-modules-regression.test.sh

### 5.2 — Node.js + JSDOM tests (install jsdom as dev dep)

- [ ] npm install --save-dev jsdom
- [ ] test/unit/cart-add.test.sh
- [ ] test/unit/cart-remove.test.sh
- [ ] test/unit/cart-update-qty.test.sh
- [ ] test/unit/cart-merge.test.sh
- [ ] test/unit/cart-empty.test.sh
- [ ] test/unit/checkout-parse.test.sh
- [ ] test/unit/checkout-total.test.sh
- [ ] test/unit/checkout-render.test.sh
- [ ] test/unit/checkout-label.test.sh
- [ ] test/unit/checkout-normalize.test.sh
- [ ] test/unit/payment-return-params.test.sh
- [ ] test/unit/payment-cancel.test.sh
- [ ] test/unit/payment-success.test.sh
- [ ] test/unit/shipping-zone-wa.test.sh
- [ ] test/unit/shipping-rate.test.sh
- [ ] test/unit/shipping-weight.test.sh

### 5.3 — E2E flow tests

- [ ] test/e2e/cart-to-checkout.test.sh
- [ ] test/e2e/checkout-to-paypal.test.sh
- [ ] test/e2e/payment-success-flow.test.sh
- [ ] test/e2e/payment-cancel-flow.test.sh
- [ ] test/e2e/product-add-flow.test.sh

### 5.4 — Verify

- [ ] scripts/test-all.sh → all pass
- [ ] Commit: test(cart): add cart unit and e2e tests
- [ ] Commit: test(checkout): add checkout and payment tests
- [ ] Commit: test(shipping): add shipping + bc script tests

---

## Phase 6 — .txt Partials + Flat-File Data

### 6.1 — Extract content to partials/

- [ ] partials/header.txt (full <header> block)
- [ ] partials/footer.txt (full <footer> block)
- [ ] partials/quick-links.txt
- [ ] partials/social-links.txt
- [ ] partials/contact-details.txt
- [ ] partials/store-address.txt
- [ ] partials/category-nav.txt

### 6.2 — Build pipeline

- [ ] scripts/generate-partials.sh (pre-deploy: inject partials into HTML at INCLUDE markers)
- [ ] scripts/lint-partials.sh (verify all INCLUDE markers resolve)

### 6.3 — Create data/ directory

- [ ] data/categories.txt (replace categories.json — slug|label|href)
- [ ] data/shipping-zones.txt (postcode_prefix|zone|state)
- [ ] data/nav-links.txt (label|href|class)
- [ ] data/social-links.txt (platform|url|icon)

### 6.4 — Cleanup

- [ ] Remove products.json (generated from CSV, inlined into JS)
- [ ] Commit: refactor(content): extract .txt partials and flat-file data

---

## Phase 7 — ESLint + Prettier

### 7.1 — Install + configure

- [ ] npm install --save-dev eslint prettier
- [ ] Create .eslintrc.json
- [ ] Create .prettierrc
- [ ] Create .prettierignore

### 7.2 — Scripts

- [ ] Update scripts/lint-js.sh (keep grep checks + add npx eslint)
- [ ] Create scripts/format-js.sh (npx prettier --write .js)
- [ ] Create scripts/format-css.sh (npx prettier --write .css)
- [ ] Create scripts/format-html.sh (npx prettier --write .html)

### 7.3 — Fix ESLint errors

- [ ] Run npx eslint, fix all errors to zero

### 7.4 — Verify

- [ ] Commit: chore(eslint): install ESLint + Prettier, add format scripts

---

## Phase 8 — SEO Fixes

### 8.1 — Add meta descriptions

- [ ] 404.html
- [ ] google-site-verification.html
- [ ] yandex_7847a6427bfa1388.html
- [ ] pages/checkout.html
- [ ] pages/social.html
- [ ] pages/store.html
- [ ] pages/store/creams.html
- [ ] pages/store/ice-tea.html
- [ ] pages/payment/fail.html
- [ ] pages/payment/success.html

### 8.2 — Shorten long <title> tags (>70 chars)

- [ ] Detect all: awk '/<title>/{gsub(/<[^>]+>/,"",$0); if(length($0)>70) print FILENAME": "$0}'
- [ ] Fix ~12 pages (terms.html, contact.html, herbal-infusions.html, etc.)

### 8.3 — Verify

- [ ] scripts/test-one.sh test/smoke/seo.test.sh → pass
- [ ] Commit: fix(seo): add meta descriptions and shorten long titles

---

## Phase 9 — AGENTS.md + TODO.md

### 9.1 — Update AGENTS.md

- [ ] Shell section: yash → /bin/sh (POSIX)
- [ ] File layout: add scripts/awk/, scripts/sed/, scripts/jq/, scripts/bc/, data/, test/headless/, test/e2e/, partials/
- [ ] Commands: add lint-shellcheck, format-js/css/html, test-headless, generate-partials, lint-partials, lint-data, all new AWK/SED/JQ/BC scripts
- [ ] Coding priority: expand with .txt partials, flat-file data conventions
- [ ] NEW: Section 9 — Headless Testing (Chromium, no PhantomJS)
- [ ] NEW: Section 10 — AWK/SED/JQ/BC Conventions
- [ ] NEW: Section 11 — Cart/Checkout/Payment Testing
- [ ] Validation sequence: expand to all new lint scripts and test directories

### 9.2 — Rewrite TODO.md

- [ ] Remove all npm-based conflicting tasks
- [ ] POSIX-aligned task list grouped by phase
- [ ] Status banner: current phase at top
- [ ] Commit: docs: update AGENTS.md and rewrite TODO.md

---

## Phase 10 — Validate + Commit + Squash-Merge

### 10.1 — Full validation

- [ ] scripts/lint-json.sh
- [ ] scripts/lint-shellcheck.sh
- [ ] scripts/lint-shell.sh
- [ ] scripts/lint-js.sh
- [ ] scripts/lint-css.sh
- [ ] scripts/lint-html-full.sh
- [ ] scripts/lint-a11y.sh
- [ ] scripts/lint-data.sh
- [ ] scripts/test-all.sh
- [ ] scripts/serve.sh start && scripts/test-headless.sh && scripts/serve.sh stop

### 10.2 — Squash-merge

- [ ] git checkout feature/enhance-ui-ux
- [ ] git merge --squash feature/static-first
- [ ] git commit -m "refactor(static-first): comprehensive infrastructure + tests + POSIX migration"

### 10.3 — Post-merge cleanup

- [ ] git fsck --full
- [ ] git worktree list (clean up any stale)
- [ ] git log --oneline -3

---

## Commit History Reference

feature/static-first has 115 commits total. Recent infrastructure commits:

- a498a6d feat(eslint): add ESLint + Prettier with format scripts and fix lint errors
- 4b499a7 feat(partials): add .txt partials infrastructure and flat-file data
- 73b6be3 fix(seo): shorten titles to <=70 chars and add meta descriptions
- b82f892 feat(tests): add cart/checkout/payment unit and e2e tests
- 1b99125 feat(tests): add Chromium headless browser test infrastructure
- bbd0db7 fix(lint): fix set -u + while read in lint scripts
- 08ea0e8 feat(lint): add lint-css-full.sh and lint-a11y.sh alias
- c628739 feat(lint): add lint-html-full.sh with comprehensive HTML checks
- 87b58b9 feat(lint): add lint-data.sh and lint-partials.sh
- a1d4bb2 feat(scripts): add BC utilities for shipping/price calculations
- 872166e feat(scripts): add JQ utilities for JSON data validation
- cbeefa feat(scripts): add SED utilities for HTML/CSS/JS processing
- 8d6d00f feat(scripts): add AWK utilities for CSS/CSV/JS analysis
- 409ce9c chore(posix): migrate all scripts to #!/bin/sh + shellcheck integration
- 1282e2f docs: update AGENTS.md and rewrite TODO.md with POSIX-aligned plan
