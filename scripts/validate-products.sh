#!/bin/sh
# scripts/validate-products.sh — POSIX product CSV validator (pipe-delimited)
# Checks: required fields present, unique IDs, valid prices, valid categories

CSV="${1:-assets/js/data/products.csv}"

if [ ! -f "$CSV" ]; then
    printf 'ERROR: CSV file not found: %s\n' "$CSV" >&2
    exit 1
fi

ERRORS=0
PASS=0

printf 'Validating: %s\n' "$CSV"

# Check header has required columns
HEADER=$(sed 1q "$CSV")
for COL in id name category inStock price; do
    if printf '%s' "$HEADER" | grep -qE "(^|\|)$COL(\|.*$)"; then
        printf '  OK: header has column: %s\n' "$COL"
    else
        printf '  FAIL: missing required column: %s\n' "$COL" >&2
        ERRORS=$((ERRORS + 1))
    fi
done

# Count data rows (skip header)
DATA_ROWS=$(awk -F'\|' 'NR>1 && NF>0' "$CSV" | wc -l)
printf '  INFO: %d product rows\n' "$DATA_ROWS"

# Check for empty IDs
EMPTY_IDS=$(awk -F'\|' 'NR>1 && $1 == ""' "$CSV" | wc -l | tr -d ' ')
if [ "$EMPTY_IDS" -eq 0 ] 2>/dev/null; then
    printf '  OK: no empty IDs\n'
    PASS=$((PASS + 1))
else
    printf '  FAIL: %s row(s) with empty ID\n' "$EMPTY_IDS" >&2
    ERRORS=$((ERRORS + 1))
fi

# Check for duplicate IDs
DUP_IDS=$(awk -F'\|' 'NR>1 {print $1}' "$CSV" | sort | uniq -d | grep -v '^$' | wc -l | tr -d ' ')
if [ "$DUP_IDS" -eq 0 ] 2>/dev/null; then
    printf '  OK: all IDs unique\n'
    PASS=$((PASS + 1))
else
    printf '  FAIL: %s duplicate ID(s) found\n' "$DUP_IDS" >&2
    ERRORS=$((ERRORS + 1))
fi

# Check inStock is boolean (true/false) or 0/1
BAD_STOCK=$(awk -F'\|' 'NR>1 && $7 !~ /^(true|false|0|1)$/' "$CSV" | wc -l | tr -d ' ')
if [ "$BAD_STOCK" -eq 0 ] 2>/dev/null; then
    printf '  OK: all inStock values valid\n'
    PASS=$((PASS + 1))
else
    printf '  FAIL: %s row(s) with invalid inStock value\n' "$BAD_STOCK" >&2
    ERRORS=$((ERRORS + 1))
fi

# Check price is numeric
BAD_PRICE=$(awk -F'\|' 'NR>1 && $8 != "" && $8 ~ /[^0-9.]/' "$CSV" | wc -l | tr -d ' ')
if [ "$BAD_PRICE" -eq 0 ] 2>/dev/null; then
    printf '  OK: all prices numeric\n'
    PASS=$((PASS + 1))
else
    printf '  FAIL: %s row(s) with non-numeric price\n' "$BAD_PRICE" >&2
    ERRORS=$((ERRORS + 1))
fi

# Check categories are non-empty slugs (no pipe chars = not field-split errors)
BAD_CATS=$(awk -F'\|' 'NR>1 && $4 == ""' "$CSV" | wc -l | tr -d ' ')
if [ "$BAD_CATS" -eq 0 ] 2>/dev/null; then
    printf '  OK: all categories present\n'
    PASS=$((PASS + 1))
else
    printf '  FAIL: %s row(s) with empty category\n' "$BAD_CATS" >&2
    ERRORS=$((ERRORS + 1))
fi

printf '\n%d check(s) passed, %d error(s) found.\n' "$PASS" "$ERRORS"
if [ "$ERRORS" -gt 0 ]; then
    exit 1
fi
exit 0
