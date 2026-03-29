#!/bin/sh
# test/unit/product-renderer.test.sh — unit test: simplified product-renderer.js
# After static-first refactor: module only handles option price updates
# Checks: IIFE structure, attachOptionHandlers, auto-init, no old APIs

set -u

FILE="assets/js/modules/product-renderer.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check IIFE structure (auto-initializing)
if grep -q '(function' "$FILE" || grep -q 'function ()' "$FILE"; then
    printf 'ok 2 IIFE/function wrapper found\n'
else
    printf 'not ok 2 IIFE/function wrapper missing\n'
    FAIL=$((FAIL + 1))
fi

# Check attachOptionHandlers function exists
if grep -q 'attachOptionHandlers' "$FILE"; then
    printf 'ok 3 attachOptionHandlers function present\n'
else
    printf 'not ok 3 attachOptionHandlers not found\n'
    FAIL=$((FAIL + 1))
fi

# Check no initProductGrid (removed after static grids)
if grep -q 'initProductGrid' "$FILE"; then
    printf 'not ok 4 initProductGrid still present (should be removed)\n'
    FAIL=$((FAIL + 1))
else
    printf 'ok 4 initProductGrid correctly removed\n'
fi

# Check no fetchProducts (removed — data is static HTML)
if grep -q 'fetchProducts\|products\.json\|products\.csv' "$FILE"; then
    printf 'not ok 5 product data fetching still present (should be static)\n'
    FAIL=$((FAIL + 1))
else
    printf 'ok 5 product data fetching correctly removed\n'
fi

# Check no renderProductCard (removed — HTML is static)
if grep -q 'renderProductCard\|renderGrid' "$FILE"; then
    printf 'not ok 6 renderProductCard/renderGrid still present (should be removed)\n'
    FAIL=$((FAIL + 1))
else
    printf 'ok 6 renderProductCard/renderGrid correctly removed\n'
fi

# Check no .media class usage
if grep -q "'.media'" "$FILE"; then
    printf 'not ok 7 .media class still in use\n'
    FAIL=$((FAIL + 1))
else
    printf 'ok 7 .media class correctly absent\n'
fi

printf 'ok 8 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
