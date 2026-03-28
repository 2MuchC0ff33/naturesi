#!/bin/sh
# scripts/jq/summarize-products.jq — Summarize products by category and stock
# Usage: jq -f scripts/jq/summarize-products.jq assets/js/data/products.json
# Outputs: count by category, stock status, price ranges

.products | {
  total: length,
  in_stock: map(select(.inStock == true)) | length,
  out_of_stock: map(select(.inStock == false)) | length,
  by_category: group_by(.category) | map({
    category: .[0].category,
    count: length,
    avg_price: (map(.price) | add) / length,
    min_price: (map(.price) | min),
    max_price: (map(.price) | max)
  })
}
