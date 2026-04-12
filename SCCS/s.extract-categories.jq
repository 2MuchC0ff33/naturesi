h32768
s 00009/00000/00000
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
# scripts/jq/extract-categories.jq — Extract unique categories from products
# Usage: jq -f scripts/jq/extract-categories.jq assets/js/data/products.json
# Outputs: sorted list of unique categories

.products |
  map(.category) |
  unique |
  sort
E 1
