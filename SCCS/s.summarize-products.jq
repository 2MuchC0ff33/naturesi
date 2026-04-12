h59081
s 00017/00000/00000
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
E 1
