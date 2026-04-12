# FTP Production — Manual Deletion Required

**Date:** 2026-04-12  
**Reason:** Shared hosting FTP user lacks delete permission. These must be removed manually via cPanel File Manager, SSH, or a host-provided file manager.

---

## Secret / Security Risk — DELETE FIRST

| File   | Why                                                       |
| ------ | --------------------------------------------------------- |
| `.env` | **CONTAINS LIVE PAYPAL CREDENTIALS** — delete immediately |

---

## Legacy JavaScript Modules — Not referenced, superseded

```
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
```

## Legacy Web Workers — Superseded

```
assets/js/shared/product-cache.shared-worker.js
assets/js/workers/csv-parser.worker.js
assets/js/workers/image-processor.worker.js
assets/js/workers/payment-tokenizer.worker.js
assets/js/workers/search-filter.worker.js
```

## Legacy Data Files — Superseded

```
assets/js/data/product-categories.json   ← superseded by products.csv
```

## Deprecated XHTML DTD Files — Not used

```
dtd/xhtml-lat1.ent
dtd/xhtml-special.ent
dtd/xhtml-symbol.ent
dtd/xhtml1-strict.dtd
```

## Manual Uploads — Not in source control

```
.well-known/csaf/2026/changes.csv
.well-known/csaf/2026/index.txt
.well-known/csaf/provider-metadata.json
.well-known/pgp-key.txt
.well-known/security-policy.txt
.well-known/thanks.txt
```

## Root-level Duplicates — Use canonical versions

```
logo.svg                      ← use assets/img/logo.svg instead
package-lock.json             ← npm lockfile, not for web serving
security.txt                  ← use .well-known/security.txt instead
```

---

## Total: 32 files to delete

Order of priority:

1. **`.env`** — immediate security risk
2. **Legacy JS modules** — 13 files, old architecture
3. **Legacy web workers** — 5 files
4. **Legacy data** — 1 file
5. **DTD files** — 4 files
6. **Well-known manual uploads** — 6 files
7. **Root-level duplicates** — 3 files
