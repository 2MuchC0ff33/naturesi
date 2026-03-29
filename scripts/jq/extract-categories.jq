#!/bin/sh
# scripts/jq/extract-categories.jq — Extract unique categories from products
# Usage: jq -f scripts/jq/extract-categories.jq assets/js/data/products.json
# Outputs: sorted list of unique categories

.products |
  map(.category) |
  unique |
  sort
