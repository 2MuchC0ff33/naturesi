h56982
s 00039/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/bin/sh
# scripts/jq/lint-data.jq — Lint JSON data files for consistency
# Usage: jq -f scripts/jq/lint-data.jq assets/js/data/products.json
# Checks: required keys present, types correct, no null IDs

def check_product:
  if .id == null or .id == "" then "ERROR: product has null/empty id"
  elif .name == null or .name == "" then "WARN: product \(.id // .name) missing name"
  elif (.price | type) != "number" then "ERROR: product \(.id // .name) price is not a number"
  elif .price <= 0 then "ERROR: product \(.id // .name) price <= 0"
  elif (.inStock | type) != "boolean" then "WARN: product \(.id // .name) inStock is not boolean"
  else "OK: \(.id)"
  end;

def check_categories:
  if type == "array" then
    .[] | check_category
  else .
  end;

def check_category:
  if .slug == null or .slug == "" then "ERROR: category has null/empty slug"
  elif .label == null or .label == "" then "ERROR: category \(.slug) missing label"
  else "OK: \(.slug)"
  end;

if .products then
  "Checking products.json...",
  (.products | length) as $count |
  "Found \($count) products",
  (.products | .[].id | values | length) as $ids |
  if $ids < $count then "WARN: some products missing id" else "All products have id" end,
  .products[] | check_product
elif .categories then
  "Checking categories.json...",
  .categories | check_categories
else
  "Unknown JSON structure"
end
E 1
