#!/bin/sh
# scripts/jq/validate-products.jq — Validate products.json structure
# Usage: jq -f scripts/jq/validate-products.jq assets/js/data/products.json
# Exits 0 if valid, non-zero if errors

def validate_product:
  if (.id | not) or (.id | type != "string") or (.id | length == 0)
  then "product missing or invalid id: \(.)" | error
  else empty
  end;

def validate_price:
  if (.price | not) or (.price | type != "number") or (.price <= 0)
  then "product \(.id // .name): price must be > 0"
  else empty
  end;

.products[] | (
  validate_product,
  validate_price
)
