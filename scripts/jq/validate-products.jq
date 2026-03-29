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
