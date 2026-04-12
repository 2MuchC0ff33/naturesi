h57096
s 00021/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
# scripts/jq/validate-products.jq  Validate products.json structure
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
E 1
