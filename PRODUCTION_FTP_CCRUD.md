# PRODUCTION FTP CRUD REPORT

# Generated: 2026-04-12

# Branch: staging

# Purpose: Exact specification for syncing FTP production with staging branch

## SUMMARY

| Action         | Count | Description                                                  |
| -------------- | ----- | ------------------------------------------------------------ |
| CREATE         | 14    | Files missing on FTP, to upload                              |
| UPDATE         | 43    | Files present but differ, to overwrite                       |
| DELETE         | 33    | Extra files on FTP, to remove                                |
| IGNORE         | 1002  | Dev-only, docs, SCCS, tests, internal scripts                |
| **NET CHANGE** | -19   | 47 files net change to FTP (14+43 create/update, -33 delete) |

Files already identical (287): no action needed.

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. CREATE — 14 files to upload to FTP

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Production assets (10)

assets/img/cart.webp
assets/img/hero-home-1200x675.jpg
assets/img/hero-home-1200x675.webp
assets/img/hero-home-1600x900.jpg
assets/img/hero-home-1600x900.webp
assets/img/hero-home-800x450.jpg
assets/img/hero-home-800x450.webp
assets/img/social-share-og.webp
assets/img/social-share-twitter.webp

### Config / utility (3)

.editorconfig
.env.example
scripts/check-production-diff.sh
scripts/deploy-ftp.sh
scripts/validate-ftp.sh

NOTE: .env.example is the safe template — the existing .env on FTP (with real
credentials) will be overwritten/deleted separately. DO NOT confuse the two.

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2. UPDATE — 43 files to overwrite on FTP

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Config (2)

.env.template
browserconfig.xml

### Well-known metadata (2)

.well-known/nodeinfo
.well-known/security.txt

### CSS partials (3)

assets/css/partials/components/products.css
assets/css/partials/elements/forms.css
assets/css/partials/elements/header.css

### HTML partials (4)

assets/html/partials/products/accessories.inc.html
assets/html/partials/products/balms.inc.html
assets/html/partials/products/creams.inc.html
assets/html/partials/products/selfcare.inc.html

### Images (4)

assets/img/hero-home-1200x675.svg
assets/img/hero-home-1600x900.svg
assets/img/hero-home-800x450.svg
assets/img/profile-placeholder-256x256.svg

### Product data (2)

assets/js/data/products.csv
assets/js/data/products.json

### Service worker (1)

assets/js/shared/shared-cart.shared-worker.js

### Root pages (14)

index.html
search.html
sitemap.xml
service-worker.js

pages/about.html
pages/cart.html
pages/checkout.html
pages/contact.html
pages/shipping-estimate.html
pages/social.html
pages/stockists.html
pages/store.html
pages/terms.html

pages/payment/fail.html
pages/payment/success.html

### Store sub-pages (11)

pages/store/accessories.html
pages/store/artisan-blends.html
pages/store/balms.html
pages/store/black-tea.html
pages/store/creams.html
pages/store/green-tea.html
pages/store/herbal-infusions.html
pages/store/ice-tea.html
pages/store/selfcare.html
pages/store/wellness-blends.html

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3. DELETE — 33 files to remove from FTP

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Secrets / server artifacts (2)

.env ← CONTAINS LIVE CREDENTIALS — delete immediately
.ftpquota ← server artifact, no business on public web

### Old JS modules (13) — replaced by staging modules

assets/js/modules/cart.js
assets/js/modules/category-select.js
assets/js/modules/checkout-bootstrap.j
assets/js/modules/featured-badges.js
assets/js/modules/payment-cancel.js
assets/js/modules/payment-return.js
assets/js/modules/payment-tokenizer-client.js
assets/js/modules/search-autocomplete.js
assets/js/modules/search-bootstrap.js
assets/js/modules/storageIDB.js
assets/js/modules/storageLocal.js
assets/js/modules/sw-client.js

### Old shared workers / web workers (4)

assets/js/shared/product-cache.shared-worker.js
assets/js/workers/csv-parser.worker.js
assets/js/workers/image-processor.worker.js
assets/js/workers/payment-tokenizer.worker.js
assets/js/workers/search-filter.worker.js

### Legacy data files (1)

assets/js/data/product-categories.json ← superseded by products.csv

### DTD files — deprecated XHTML legacy (3)

dtd/xhtml-lat1.ent
dtd/xhtml-special.ent
dtd/xhtml-symbol.ent
dtd/xhtml1-strict.dtd

### Manual uploads not in source (5)

.well-known/csaf/2026/changes.csv
.well-known/csaf/2026/index.txt
.well-known/csaf/provider-metadata.json
.well-known/pgp-key.txt
.well-known/security-policy.txt
.well-known/thanks.txt
logo.svg ← root-level logo (assets/img/logo.svg used instead)
package-lock.json ← npm lockfile, not for web serving
security.txt ← root-level; .well-known/security.txt is canonical

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4. IGNORE — NOT deployed (dev/internal/sccs)

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: 1002 files and directories excluded.

Breakdown:
SCCS/ ~430 files Version control history (git-tracked)
docs/ 4 files Developer documentation
test/ 108 files Smoke/unit/e2e/headless tests
partials/ 16 files Build-time includes (pre-processed out)
.vscode/ 5 files Editor config
.opencode/ 3 files Agent workspace metadata
.checksums/ 12 files Reproducibility audit trail
.patches/ 4 files Patch logs
hooks/ 2 files Git hooks

Individual exclusions:
AGENTS.md Internal agent guidelines
TODO.md Task tracker
Makefile Build automation
README.md Project documentation
DEPLOYMENT.md Deployment runbook
.gitignore Git config
.gitattributes Git config

scripts/lint-_.sh Linting scripts (dev-only)
scripts/test-_.sh Test scripts (dev-only)
scripts/serve.sh Dev server
scripts/watch.sh Dev watcher
scripts/format-_.sh Code formatters (dev-only)
scripts/minify-_.sh Minifiers (dev-only)
scripts/generate-_.sh Content generators (dev-only)
scripts/bc/_.bc BC arithmetic scripts (dev/testing only)
scripts/awk/_.awk AWK utility scripts
scripts/sed/_.sed SED utility scripts
scripts/jq/\*.jq JQ utility scripts
scripts/dev_server.py Python dev server
scripts/normalize-skus.cjs Node dev tool
scripts/report-missing-skus.cjs Node dev report
scripts/verify-skus.cjs Node dev tool
scripts/wait-for-port.cjs Node dev utility
scripts/zero-drift-check.sh Dev sync checker
scripts/process_html.sh Dev HTML processor
scripts/maintenance-cleanup.sh Dev maintenance
scripts/git-list-stale.sh Dev git tool
scripts/git-maintain.sh Dev git tool
scripts/check-agents-md.sh Agent check
scripts/check-dev-sync.sh Dev sync tool
scripts/products-extraction-report.md Dev report
scripts/promote.sh Post-merge script (run locally)

src/avatar*.png Development source avatars
headless-test-*.txt Test output logs
headless-test-results-full.txt
headless-test-retry.txt

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 5. DEPLOYMENT ORDER

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — Pre-deploy backup
□ Download current full FTP mirror for rollback
wget --recursive --user=... --password=... ftp://ftp.naturesinfusions.com.au/ /tmp/ftp-backup/

STEP 2 — DELETE first (remove stale/secret files before new content)
Delete each file in Section 3.
Order: .env → old JS modules → old workers → legacy files → DTD → manual uploads
NOTE: .env must be deleted first (contains live credentials).

STEP 3 — UPDATE (overwrite existing files)
Upload each file in Section 2.
Most critical: products.csv, products.json (product data)
Then: all pages/\*.html, then CSS/JS/img assets, then config files.

STEP 4 — CREATE (upload missing files)
Upload each file in Section 1.
Order: images → config → scripts → .env.example

STEP 5 — Verify
□ Run scripts/validate-ftp.sh to confirm sync
□ Spot-check key pages: index.html, pages/store.html, pages/cart.html
□ Confirm .env is NOT on server
□ Confirm old modules deleted: ls assets/js/modules/ should be clean

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 6. SQUASH-MERGE NOTES

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When staging is squash-merged into main:

- All 1059 files in staging become the new canonical main branch.
- SCCS/ directory is part of the branch history — after squash, main will include
  the SCCS/ files (source-tracked for historical auditability, not deployed).
- After merge, main will have 1059 files (vs 547 previously on main).
- FTP sync via this report should happen AFTER squash-merge is complete.
- The 33 "extra" files on FTP (Section 3) are NOT in any branch — they are
  manual uploads that predate the current git workflow.

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 7. FILE LISTS (machine-readable)

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/tmp/to-upload-final.txt — 14 CREATE files
/tmp/diff-files.txt — 43 UPDATE files (from checksum comparison)
/tmp/extra-on-ftp.txt — 33 DELETE files
/tmp/staging-files.txt — 1059 total staging files
/tmp/ftp-files.txt — 365 total FTP files
/tmp/in-both.txt — 332 files present on both sides
/tmp/missing-on-ftp.txt — 727 files missing on FTP (all staging - ftp)

To regenerate this report:
git ls-tree -r --name-only staging | sort > /tmp/staging-files.txt

# (mirror FTP with wget, then compare as documented above)
