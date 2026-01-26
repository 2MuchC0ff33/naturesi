# Batch 6 — Product Listing, Filters & Sorting: Summary

Overview
- Goal: Stabilise product card selectors and introduce clear data-attribute hooks for product title, price, image, and sku. This reduces fragile descendant selectors and makes JS resilient to markup restructuring.
- Approach: Add dual-selector fallback logic in `cart-init.js` (prefer `[data-product]`, `[data-product-title]`, `[data-product-price]`, etc., but fall back to legacy `.product`, heading tags, and `[data-price]`). Enhance `product-helpers.js` to recognise `[data-product-gallery]` and `img[data-product-image]`.

Files changed
- `assets/js/modules/cart-init.js` — Accepts `[data-product]` as component root and adds detection for `[data-product-title]`, `[data-product-price]`, `[data-product-image]`, `[data-product-sku]` and `[data-product-description]`.
- `assets/js/modules/product-helpers.js` — Supports `[data-product-gallery]` and `img[data-product-image]`, adds lazy loading for images with `data-product-image`.
- `analysis/global_reference_map.json` — Added preferred selectors aliases and migration notes for product-related selectors.
- `analysis/selector_reference.json` — Updated product-related module entries with new selectors and data-attributes.

Why this matters
- Data-attribute component roots are robust against deeper DOM restructuring (e.g., moving price or image markup inside additional wrappers). New attributes make automated migration and testing easier.

Risk & mitigation
- Risk: Introducing `[data-product-price]` without validating values could lead to mismatched totals if authors forget to populate it. Mitigation: Keep legacy fallback to existing `[data-price]` and itemprop parsing, add E2E assertion during migration to validate totals.

Manual QA checklist
- Add a single product card with the new `data-*` attributes and verify add-to-cart captures name, price and image correctly.
- Confirm product-helpers modifies image classes and sets `loading="lazy"` for `data-product-image` entries.
- Test checkout totals after adding items using migrated product data.

Next steps
- Instrument a dev-run or add tests that assert the price extracted from DOM matches product feed values for a sample of SKUs.
- Plan a migration that introduces `data-product` to 25% of product cards, run E2E, then expand gradually.
