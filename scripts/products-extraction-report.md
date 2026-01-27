# Products Extraction Report

- Files scanned: `pages/store/*.html` (all store pages)
- Products extracted: 32
- Output: `assets/js/data/products.generated.json`

## Items needing manual review ⚠️
- product-apple — Out of stock; no price or options found (email-notify form present). Confirm if to keep archived or add price when restocked.
- product-detox — Out of stock; no price or options. Confirm SKU/version mapping and desired default price.
- product-infuser — Out of stock; no price or options.
- product-orangeginger — Out of stock; packaging/options located outside the article (extracted none). Confirm packaging placement and desired SKU mapping.
- product-digestive — Marked out-of-stock in some pages; check sources if it should remain out-of-stock.

## Recommendations
1. Review the flagged items above and provide price(s) or mark them as archived/out-of-stock intentionally.
2. Review duplicates or near-duplicates (e.g., `enchanted-turmeric-60g` vs `product-turmeric`) and decide canonical `id`/`sku` mapping.
3. After human review, rename `assets/js/data/products.generated.json` to `assets/js/data/products.json` (or replace contents) and run `node scripts/validate-products.js` as a final check.

## How to re-run
- Generate: `node scripts/generate-products.js`
- Validate: `node scripts/validate-products.js`

---
Generated on: 2026-01-25
