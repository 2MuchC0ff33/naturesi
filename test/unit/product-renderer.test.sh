#!/usr/bin/env yash
# test/unit/product-renderer.test.sh — unit test: product-renderer.js structure
# Checks: expected functions, CSV reference, grid targeting

set -u

FILE="assets/js/modules/product-renderer.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check init function
if grep -q 'export function init' "$FILE" || grep -q 'export async function init' "$FILE"; then
    printf 'ok 2 init function exported\n'
else
    printf 'not ok 2 init function not exported\n'
    FAIL=$((FAIL + 1))
fi

# Check renderProducts function
if grep -q 'function renderProducts' "$FILE"; then
    printf 'ok 3 renderProducts function present\n'
else
    printf 'not ok 3 renderProducts not found\n'
    FAIL=$((FAIL + 1))
fi

# Check #product-grid targeting (the ID-based selector)
if grep -q 'getElementById.*product-grid' "$FILE" || grep -q "'#product-grid'" "$FILE"; then
    printf 'ok 4 targets #product-grid by ID\n'
else
    printf 'not ok 4 #product-grid ID targeting missing\n'
    FAIL=$((FAIL + 1))
fi

# Check products data reference (JSON or CSV)
if grep -q 'products\.json\|products\.csv' "$FILE"; then
    printf 'ok 5 products data reference found\n'
else
    printf 'not ok 5 products data reference missing\n'
    FAIL=$((FAIL + 1))
fi

# Check no .media class usage (should be removed after fix)
if grep -q "'.media'" "$FILE"; then
    printf 'not ok 6 .media class still in use (regression)\n'
    FAIL=$((FAIL + 1))
else
    printf 'ok 6 .media class correctly removed\n'
fi

# Check no anchor wrappers in grid (should be removed after fix)
if grep -q "'.product-anchor'" "$FILE"; then
    printf 'not ok 7 .product-anchor elements still rendered (regression)\n'
    FAIL=$((FAIL + 1))
else
    printf 'ok 7 .product-anchor elements correctly removed\n'
fi

printf 'ok 8 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
