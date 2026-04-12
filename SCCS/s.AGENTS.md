h53645
s 00643/00000/00000
d D 1.1 26/04/12 13:56:43 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:43 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
# AGENTS.md — Agent Guidelines

> Static HTML5 + vanilla CSS/JS. POSIX-first. All changes on branches. Never on main.

---

## 1. QUICK REFERENCE

```sh
# Start every session
git fsck --full && git status && git branch -a && git worktree list

# Validate (run after every change)
scripts/lint-json.sh && scripts/lint-shellcheck.sh && scripts/lint-css.sh && scripts/lint-html.sh && scripts/test-all.sh

# Commit workflow
git add <files> && git diff --cached && git commit -m "<type>(<scope>): summary"

# Serve locally
scripts/serve.sh start
scripts/watch.sh &
```

### Quick Decision Keys

| Task                     | Command                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| New file/content change  | `git checkout -b feat/<name>`                                      |
| Bug fix                  | `git checkout -b fix/<name>`                                       |
| Test only                | `git checkout -b test/<name>`                                      |
| Large feature (5+ files) | Use worktree: `git worktree add ../naturesi-<name> -b feat/<name>` |
| Done with worktree       | `git worktree remove ../naturesi-<name> && git worktree prune`     |

### Shell Rules

- Shebang: `#!/bin/sh` (POSIX only)
- **NEVER**: `[[`, `((`, `declare`, `local`, `$RANDOM`, bash arrays
- **USE**: `while read`, `awk`, POSIX `sh`

### CSS Rules

- **NEVER**: `//` comments
- **ONLY**: `/* ... */` block comments

---

## 2. PURPOSE & SCOPE

Guide agents on lint, test, serve, and commit using POSIX utilities.

**Project type**: Static HTML5 + vanilla CSS + vanilla JS (last resort)
**Data priority**: `.txt` > `.csv` > JSON (only when hierarchical needed)
**Secrets**: `.env` at repo root (never committed)

**Shell**: `/bin/sh` + POSIX utils (awk, sed, grep, jq, bc)
**Formatting**: Node.js tools (ESLint, Prettier) for JS/CSS/HTML only

---

## 3. FILE LAYOUT

```
scripts/          — maintenance scripts (lint, minify, serve, watch)
scripts/awk/     — AWK: extract-css-vars, csv-stats, css-complexity
scripts/sed/     — SED: normalize-meta, strip-comments, extract-urls
scripts/jq/      — JQ: validate-products, build-nav, lint-data
scripts/bc/      — BC: shipping-calc, price-total, tax-calc
test/smoke/      — smoke tests (html, css, links, a11y)
test/unit/       — unit tests (cart, checkout, payment, shipping)
test/headless/   — Chromium headless (DOM, localStorage, forms)
test/e2e/        — end-to-end flows (cart→checkout→paypal)
data/            — flat-file data (categories.txt, shipping-zones.txt)
partials/        — .txt content partials (header, footer, nav)
assets/          — CSS, JS, images
pages/           — HTML pages
.env             — secrets (gitignored)
.env.template    — placeholder keys
```

---

## 4. CODING PRIORITY

1. Plaintext `.txt` — content, key/value pairs
2. `.csv` — tabular data (products.csv is canonical)
3. Static HTML5 — semantic, accessible, no JS unless unavoidable
4. Vanilla CSS — modular partials, `/* */` only
5. JSON — only when hierarchical/array structure needed
6. Native browser APIs — before vanilla JS
7. Vanilla JS — last resort; small, single-purpose modules

### HTML Rules

- `<!DOCTYPE html>` top-line, `<html lang="en-AU">`
- `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width,initial-scale=1">`
- Semantic: `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`
- Images: `alt` text or `role="presentation"`
- Forms: `<label for>` bound to every `<input>`
- ARIA only when semantic HTML cannot express semantics

### Naming Conventions

| Type                 | Style            | Example         |
| -------------------- | ---------------- | --------------- |
| Files                | kebab-case       | `cart-store.js` |
| Variables/functions  | camelCase        | `updateCart()`  |
| Classes/constructors | PascalCase       | `CartStore`     |
| Constants            | UPPER_SNAKE_CASE | `MAX_ITEMS`     |

---

## 5. GIT WORKFLOW

### 5a. Session Start Checklist

**MANDATORY** — Run at START of every session:

```sh
git fsck --full
git status
git log --oneline -3
git branch -a
git worktree list
```

- If `fsck` reports dangling/blobs with "missing" → investigate before proceeding
- If uncommitted changes exist → ask user to commit, stash, or abandon

### 5b. Branch Strategy

```
main (protected)
  └── feature/X, fix/Y, test/Z (short-lived branches)
        └── worktree-per-change (for large changes)
```

**Rules**:

- **NEVER** commit directly to `main`
- **ALWAYS** work on a feature/fix/test branch
- **ALWAYS** check current branch before commits (`git branch`)
- **NEVER** push directly to `main` — all via PR/review

### 5c. Choosing: Branch vs Worktree

| Use Branch               | Use Worktree                   |
| ------------------------ | ------------------------------ |
| Single file or 1-2 files | 5+ files across systems        |
| Simple, obvious change   | Exploratory/experimental       |
| Single session           | Multi-session feature          |
| Clean PR wanted          | Keeping branch clean preferred |

### 5d. Branch Workflow

```sh
# Create feature branch
git checkout -b feat/my-feature

# Make changes, validate, commit (small commits = good)
./scripts/lint-html.sh <file>
./scripts/lint-css.sh <file>
./scripts/test-all.sh
git add <changed files>
git commit -m "feat(scope): concise summary"

# Before push — validate one more time
git fsck --full && git log --oneline -3 && git diff --stat

# Push
git push -u origin feat/my-feature
```

### 5e. Worktree Workflow (large changes)

```sh
# 1. Create feature branch + worktree
git checkout -b feat/my-feature
git worktree add ../naturesi-my-feature feat/my-feature

# 2. Switch to worktree
cd ../naturesi-my-feature

# 3. Make changes, lint, test, commit
# ... edit files ...
git add <files> && git commit -m "feat(scope): logical unit"

# 4. Integrate back to feature branch
cd /path/to/main-repo
git merge --squash ../naturesi-my-feature
git commit -m "feat(scope): summary of squashed work"

# 5. Cleanup immediately
git worktree remove ../naturesi-my-feature
git worktree prune

# 6. Verify clean state
git fsck --full && git worktree list
```

### 5f. Commit Message Format

```
<type>(<scope>): short summary (50 chars, imperative mood, no period)
```

| Type       | When to Use                             |
| ---------- | --------------------------------------- |
| `feat`     | New user-facing feature                 |
| `fix`      | Bug fix                                 |
| `perf`     | Performance improvement                 |
| `refactor` | Internal change, no feature or fix      |
| `chore`    | Tooling, config, deps, CI               |
| `docs`     | Documentation only                      |
| `test`     | Adding or fixing tests                  |
| `style`    | Formatting/whitespace (no logic change) |

**Examples**:

```
feat(hero): remove autoplay from video element
fix(search): add missing form id on contact.html
docs(AGENTS): add git workflow documentation
```

**Rules**:

- First line: imperative mood, no period, 50 chars max
- Body (optional): explain WHY, not WHAT. 72 chars per line
- Footer: reference issues: "Fixes #42"
- **NEVER** commit `.env` with real values
- **EVERY** commit must pass lint + tests locally

### 5g. Validation Before Commit

1. Run all relevant lints (see Section 7)
2. `git status` — review changed files (check for deleted/unused)
3. `git worktree list` — check for stale worktrees
4. `git diff --stat` — verify scope
5. `git diff --cached` — inspect staged diff
6. Commit with meaningful message

**DO NOT commit broken code, failing lints, or failing tests.**

### 5h. Session End Checklist

After every commit or set of commits:

```sh
git fsck --full
git log --oneline -3
```

### 5i. Git Reference

| Action             | Command                                                        |
| ------------------ | -------------------------------------------------------------- |
| Stage changes      | `git add <files>` (never `git add .` unless truly all related) |
| Unstage            | `git reset HEAD <file>`                                        |
| Discard changes    | `git checkout -- <file>`                                       |
| Discard all        | `git checkout -- .`                                            |
| Stash              | `git stash push -m "wip: description"`                         |
| Stash + untracked  | `git stash push -u -m "wip: description"`                      |
| View history       | `git log --oneline -10`                                        |
| View diff          | `git diff HEAD~3..HEAD`                                        |
| Squash N commits   | `git reset --soft HEAD~N` then re-commit                       |
| Interactive rebase | `git rebase -i HEAD~N`                                         |
| Force-push (safe)  | `git push --force-with-lease`                                  |
| Find lost commit   | `git reflog` then `git checkout <hash>`                        |

**NEVER amend pushed commits. Make new fix commits instead.**

---

## 6. LOCAL DEVELOPMENT

```sh
# 1. Start apache2
scripts/serve.sh start

# 2. Open site in browser; edit files with opencode concurrently

# 3. Start watcher for hot-reload
scripts/watch.sh &

# 4. On file save, watcher triggers graceful reload
# Browser polls /reload.txt every ~1s → location.reload()
```

---

## 7. VALIDATION SEQUENCE

Run after **every substantive change**:

```sh
# 1. JSON validity
scripts/lint-json.sh

# 2. Shell scripts (ShellCheck + POSIX)
scripts/lint-shellcheck.sh
scripts/lint-shell.sh

# 3. JS syntax
scripts/lint-js.sh

# 4. CSS lint
scripts/lint-css.sh

# 5. HTML lint (basic)
scripts/lint-html.sh

# 6. Accessibility
scripts/lint-a11y.sh

# 7. Data files
scripts/lint-data.sh

# 8. Partial includes
scripts/lint-partials.sh

# 9. Unit + smoke tests (no server needed)
scripts/test-all.sh

# 10. Headless browser tests (requires apache running)
scripts/test-headless.sh
```

**If any step fails**: fix and re-run.
**After 3 failed attempts**: summarize root causes, escalate to human.

### Lint Commands Reference

| Check        | Command                                   |
| ------------ | ----------------------------------------- |
| HTML (basic) | `scripts/lint-html.sh <file>`             |
| HTML (full)  | `scripts/lint-html-full.sh`               |
| CSS (basic)  | `scripts/lint-css.sh <file>`              |
| CSS (full)   | `scripts/lint-css-full.sh`                |
| Shell        | `scripts/lint-shellcheck.sh`              |
| JSON         | `scripts/lint-json.sh`                    |
| Data         | `scripts/lint-data.sh`                    |
| A11y         | `scripts/lint-a11y.sh`                    |
| Partials     | `scripts/lint-partials.sh`                |
| Single test  | `scripts/test-one.sh test/path/test.sh`   |
| All tests    | `scripts/test-all.sh`                     |
| Filter tests | `TEST_PATTERN="cart" scripts/test-all.sh` |

### Format Commands

```sh
scripts/format-js.sh      # npx prettier --write .js
scripts/format-css.sh     # npx prettier --write .css
scripts/format-html.sh     # npx prettier --write .html
```

### Minify Commands

```sh
scripts/minify-css.sh <in.css> <out.css>
scripts/minify-js.sh <in.js> <out.js>
```

---

## 8. ENVIRONMENT VARIABLES & SECRETS

`.env` at repo root — **NEVER committed**.

**Required keys**:

```env
PAYPAL_EMAIL=
PRODUCTS_CSV_PATH=./assets/js/data/products.csv
SITE_BASE_URL=http://localhost:8000
STORE_POSTCODE=6147
STORE_STATE=WA
```

**Rules**:

- `.env` is `.gitignored`
- **NEVER** populate `PAYPAL_EMAIL` or secrets without explicit user values
- If `.env` missing/incomplete → ask user for values first
- `.env.template` holds safe placeholder keys (can be committed)

---

## 9. REFACTOR / HOUSEKEEPING

**Suckless principle**: do one thing well, simply.

- Remove unused, duplicated, or conflicting files
- **Single source of truth**: one CSV for products (do not split)
- Remove large unused JS modules; favor small, testable scripts
- Work on a branch, commit often, small PRs
- Include lint + test validation in every PR

**Escalate to human review before**:

- Touching payment/PayPal flow
- Adding external services or analytics
- Large service-worker or caching policy changes
- Modifying `.env` production values

---

## 10. TESTING

### Test Layers

| Layer   | What             | Server Needed        |
| ------- | ---------------- | -------------------- |
| Layer 1 | Smoke (file://)  | No                   |
| Layer 2 | Unit tests       | No                   |
| Layer 3 | Headless browser | Yes (apache running) |
| Layer 4 | E2E flows        | Yes                  |

### Layer 1 — Smoke (no server)

```sh
test/headless/site-smoke.test.sh      # load every HTML page, no crash
test/headless/dom-structure.test.sh   # verify key DOM elements
```

### Layer 2 — Unit (no server)

```sh
# POSIX shell tests
test/unit/cart-key-consistency.test.sh
test/unit/checkout-form-structure.test.sh
test/unit/paypal-urls.test.sh
test/unit/shipping-zone.test.sh

# Business logic tests
test/unit/cart-add.test.sh
test/unit/cart-remove.test.sh
test/unit/cart-update-qty.test.sh
test/unit/cart-merge.test.sh
test/unit/cart-empty.test.sh
test/unit/checkout-parse.test.sh
test/unit/checkout-total.test.sh
test/unit/shipping-rate.test.sh
test/unit/shipping-weight.test.sh
```

### Layer 3 — Headless (Chromium required)

```sh
# Prerequisites
scripts/serve.sh start

# Run
scripts/test-headless.sh
# or individual:
test/headless/cart-render.test.sh
test/headless/checkout-form.test.sh
test/headless/paypal-redirect.test.sh
test/headless/payment-success.test.sh
test/headless/payment-cancel.test.sh
test/headless/shipping-estimate.test.sh
test/headless/product-add-flow.test.sh
test/headless/service-worker.test.sh
```

**Chromium**: version 146+ at `/snap/bin/chromium`
**Pattern**:

```sh
chromium --headless --disable-gpu --no-sandbox \
  --enable-logging --v=1 \
  --virtual-time-budget=5000 \
  "$TARGET_URL" --dump-dom 2>&1
```

### Testing Rules

- **printf**: use exact specifier count `'%s %d\n' "$VAR1" "$VAR2"`
- **TAP header**: `'1..%d\n'` needs `$((PASS + FAIL))`, not `$FAIL`
- **Chromium --dump-dom**: does NOT execute inline JS for `file://` URLs
- **localStorage**: may not work with `file://` protocol — use `localhost`
- **Production verification**: `curl -s URL | grep` to verify fixes exist
- **Test numbers**: keep sequential in loops (reuse = confusing)

### Regression Check

```sh
grep -rE 'product-grid-generator|checkout-bootstrap|worker-registry|autoplay-loop|shared-cart' \
  assets/js/ --include='*.js'
# Must return zero matches
```

---

## 11. SCRIPTING CONVENTIONS

All scripts in `scripts/` subdirectories by language.

### Requirements (all languages)

- Shebang: `#!/bin/sh` (wraps AWK/JQ) or be directly executable
- Header comment: purpose, usage, examples
- Exit 0 on success, non-zero on failure
- Self-test for jq/bc scripts

### AWK Scripts (`scripts/awk/`)

Use GNU AWK (gawk) only when necessary; prefer POSIX AWK.

| Script                 | Purpose                         |
| ---------------------- | ------------------------------- |
| `extract-css-vars.awk` | Extract `--var: value` from CSS |
| `csv-stats.awk`        | Product counts, price ranges    |
| `css-complexity.awk`   | Selectors, nesting depth        |
| `js-metrics.awk`       | Functions, exports, comments    |
| `check-links.awk`      | Link validation                 |
| `json-report.awk`      | JSON report generation          |

### SED Scripts (`scripts/sed/`)

Use POSIX BRE; ERE only when necessary with `-E` flag.

| Script                   | Purpose                         |
| ------------------------ | ------------------------------- |
| `normalize-meta.sed`     | Collapse multi-line meta tags   |
| `strip-css-comments.sed` | Remove `/* */` from CSS         |
| `strip-js-comments.sed`  | Remove `//` and `/* */` from JS |
| `extract-urls.sed`       | Pull src/href/url() values      |
| `dedupe-css-rules.sed`   | Remove duplicate CSS rules      |

### JQ Scripts (`scripts/jq/`)

Use jq 1.7. Standalone `.jq` files.

| Script                  | Purpose                          |
| ----------------------- | -------------------------------- |
| `validate-products.jq`  | Validate products.json structure |
| `summarize-products.jq` | Category counts, stock status    |
| `extract-categories.jq` | Unique sorted categories         |
| `enrich-cart.jq`        | Join cart + products             |
| `build-nav.jq`          | Generate `<li>` nav HTML         |
| `lint-data.jq`          | Lint all JSON data files         |
| `validate-paypal.jq`    | Validate paypal.json structure   |
| `ftp-list-parser.jq`    | Parse FTP MLSD output            |

### BC Scripts (`scripts/bc/`)

Use bc 1.07.1 with `scale=2` for AUD cent precision.

| Script               | Purpose                                 |
| -------------------- | --------------------------------------- |
| `shipping-calc.bc`   | Base + surcharges + GST                 |
| `price-total.bc`     | Qty × price, subtotal, grand            |
| `tax-calc.bc`        | 10% GST                                 |
| `price-breakdown.bc` | Full: subtotal → GST → shipping → grand |

Each `.bc` script must include inline self-test:

```bc
/* SELF-TEST: echo "10 1.1" | bc -q scripts/bc/tax-calc.bc */
```

---

## 12. FTP DEPLOYMENT

Credentials in `.env` (NOT committed):

```env
FTP_HOST=ftp.naturesinfusions.com.au
FTP_USER=twomuchcoffee@naturesinfusions.com.au
FTP_PASS=<password>
```

### Deploy Commands

```sh
scripts/deploy-ftp.sh           # deploy all changes
scripts/deploy-ftp.sh --dry-run  # preview only
scripts/deploy-ftp.sh --files "index.html assets/css/style.css"  # specific files
scripts/validate-ftp.sh         # verify FTP matches local (cksum)
```

### FTP Rules

- **Auth**: `curl -u "user:pass"` (NOT embedded in URL)
- **FTP root**: IS the public directory (no `/public_html`)
- **FTPS**: `--ftp-ssl` flag (not `--ftp-ssl-control`)
- **NEVER deploy `.env`** — contains FTP credentials
- `curl -T` fails silently without proper flags
- Always `--dry-run` first, test single file before bulk
- Verify with `curl` against production URL after deploy

---

## 13. AGENTS.MD SYNC (pre-commit hook)

Pre-commit hook: `.git/hooks/pre-commit`

**Hook checks**: `scripts/check-agents-md.sh`

- Scans `scripts/` for referenced tools (awk, sed, jq, bc, chromium)
- Compares against Section references in this file
- **BLOCKS commit** if AGENTS.md is out of sync
- Exit 0 = allow, Exit 1 = block

### Auto-fix Mode

```sh
scripts/check-agents-md.sh --fix  # auto-update AGENTS.md
```

### Sections to Keep in Sync

| Section | What                              |
| ------- | --------------------------------- |
| 7       | Commands (scripts added/removed)  |
| 3       | File layout (files added/removed) |
| 11      | AWK/SED/JQ/BC scripts             |
| 10      | Tests                             |
| 12      | FTP deployment scripts            |

### Strict Mode

```sh
AGENTS_SYNC_STRICT=true  # fail if tools missing from AGENTS.md
```

---

## A. REFERENCES

| File                              | Purpose                                   |
| --------------------------------- | ----------------------------------------- |
| `.github/copilot-instructions.md` | CSS policy, auto-context rules            |
| `.github/agents/*.md`             | Agent-specific instructions               |
| `.github/instructions/*.md`       | Security, a11y, etc.                      |
| `README`                          | Project intent                            |
| `TODO.md`                         | Implementation task tracker (Phases 1-10) |
| `assets/js/data/products.csv`     | Canonical product data                    |
| `assets/js/modules/`              | JS modules (cart, checkout, payment)      |
| `scripts/`                        | POSIX maintenance scripts                 |

**Contact**: `2MuchC0ff33@example.org` (replace before merge)
E 1
