h58107
s 00078/00000/00000
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
# test/unit/csv-generate.test.sh — unit test: CSV→JSON pipeline
# Runs generate-products.sh and validates the output JSON

CSV="assets/js/data/products.csv"
JSON="assets/js/data/products.json"

if [ ! -f "$CSV" ]; then
    printf 'not ok 1 CSV file not found (skip)\n'
    exit 0
fi

printf 'ok 1 CSV file exists\n'

# Count rows in CSV
ROWS=$(awk 'NR>1 && NF>0' "$CSV" | wc -l | tr -d ' ')
printf 'ok 2 CSV has %d product rows\n' "$ROWS"

# Run generate script
SCRIPT_DIR="$(cd "$(dirname "$0")/../../scripts" && pwd)"
$SCRIPT_DIR/generate-products.sh "$CSV" "$JSON" >/dev/null 2>&1

if [ -f "$JSON" ]; then
    printf 'ok 3 JSON file generated\n'
else
    printf 'not ok 3 JSON file generated\n'
    exit 1
fi

# Validate JSON
if jq . "$JSON" >/dev/null 2>&1; then
    printf 'ok 4 generated JSON is valid\n'
else
    printf 'not ok 4 generated JSON is valid\n'
    exit 1
fi

# Check products array exists
HAS_ARRAY=$(jq -e '.products | type == "array"' "$JSON" 2>/dev/null && echo yes || echo no)
if [ "$HAS_ARRAY" = "yes" ]; then
    PROD_COUNT=$(jq '.products | length' "$JSON" 2>/dev/null)
    printf 'ok 5 products array has %s entries\n' "$PROD_COUNT"
else
    printf 'not ok 5 products array exists\n'
fi

# Check first product has required fields
FIRST=$(jq -e '.products[0]' "$JSON" 2>/dev/null)
if [ -n "$FIRST" ] && [ "$FIRST" != "null" ]; then
    ID=$(jq -r '.products[0].id' "$JSON" 2>/dev/null)
    NAME=$(jq -r '.products[0].name' "$JSON" 2>/dev/null)
    PRICE=$(jq -r '.products[0].price' "$JSON" 2>/dev/null)
    INSTOCK=$(jq -r '.products[0].inStock' "$JSON" 2>/dev/null)
    if [ -n "$ID" ] && [ "$ID" != "null" ]; then
        printf 'ok 6 first product has id=%s\n' "$ID"
    else
        printf 'not ok 6 first product has id\n'
    fi
    if [ -n "$NAME" ] && [ "$NAME" != "null" ]; then
        printf 'ok 7 first product has name=%s\n' "$NAME"
    else
        printf 'not ok 7 first product has name\n'
    fi
    if [ -n "$PRICE" ] && [ "$PRICE" != "null" ]; then
        printf 'ok 8 first product has price=%s\n' "$PRICE"
    else
        printf 'not ok 8 first product has price\n'
    fi
    if [ -n "$INSTOCK" ] && [ "$INSTOCK" != "null" ]; then
        printf 'ok 9 first product has inStock=%s\n' "$INSTOCK"
    else
        printf 'not ok 9 first product has inStock\n'
    fi
else
    printf 'not ok 6 first product exists\n'
fi

exit 0
E 1
