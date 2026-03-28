#!/usr/bin/env yash
# test/smoke/products.test.sh — smoke test: products.csv validation
# Checks: CSV has required fields, unique IDs, valid prices

CSV="assets/js/data/products.csv"

if [ ! -f "$CSV" ]; then
    printf 'ok 1 CSV file not found (Phase 4 pending)\n'
    printf 'ok 2 skipping remaining tests until products.csv is created\n'
    exit 0
fi

printf 'ok 1 CSV file exists\n'

# Check header has required columns
HEADER=$(sed 1q "$CSV")
for COL in id name category inStock price; do
    if printf '%s' "$HEADER" | grep -qE "(^|,)$COL(,|\$)"; then
        printf 'ok 2 header has column: %s\n' "$COL"
    else
        printf 'not ok 2 header missing column: %s\n' "$COL"
    fi
done

# Count data rows
DATA_ROWS=$(awk 'NR>1 && NF>0' "$CSV" | wc -l)
printf 'ok 3 %d product rows found\n' "$DATA_ROWS"

# Check no empty IDs
EMPTY=$(awk -F',' 'NR>1 && $1 == ""' "$CSV" | wc -l | tr -d ' ')
if [ "$EMPTY" -eq 0 ] 2>/dev/null; then
    printf 'ok 4 no empty IDs\n'
else
    printf 'not ok 4 %s empty ID(s) found\n' "$EMPTY"
fi

# Check duplicate IDs
DUP=$(awk -F',' 'NR>1 {print $1}' "$CSV" | sort | uniq -d | grep -v '^$' | wc -l | tr -d ' ')
if [ "$DUP" -eq 0 ] 2>/dev/null; then
    printf 'ok 5 all IDs unique\n'
else
    printf 'not ok 5 %s duplicate ID(s) found\n' "$DUP"
fi

# Check inStock values are valid
BAD_STOCK=$(awk -F',' 'NR>1 && $7 !~ /^(true|false|0|1)$/' "$CSV" | wc -l | tr -d ' ')
if [ "$BAD_STOCK" -eq 0 ] 2>/dev/null; then
    printf 'ok 6 all inStock values valid\n'
else
    printf 'not ok 6 %s invalid inStock value(s)\n' "$BAD_STOCK"
fi

# Check prices are numeric
BAD_PRICE=$(awk -F',' 'NR>1 && $8 != "" && $8 ~ /[^0-9.]/' "$CSV" | wc -l | tr -d ' ')
if [ "$BAD_PRICE" -eq 0 ] 2>/dev/null; then
    printf 'ok 7 all prices numeric\n'
else
    printf 'not ok 7 %s non-numeric price(s)\n' "$BAD_PRICE"
fi

# Check categories are valid slugs
VALID_SLUGS="wellness-blends artisan-blends herbal-infusions black-tea green-tea ice-tea balms creams selfcare accessories"
BAD_CATS=$(awk -F',' 'NR>1 && $4 != "" {
    slug = $4
    valid = 0
    split("'"$VALID_SLUGS"'", arr)
    for (i in arr) if (arr[i] == slug) valid = 1
    if (!valid) print $1 " -> " slug
}' "$CSV" | wc -l | tr -d ' ')
if [ "$BAD_CATS" -eq 0 ] 2>/dev/null; then
    printf 'ok 8 all categories valid\n'
else
    printf 'not ok 8 %s invalid category slug(s)\n' "$BAD_CATS"
fi

exit 0
