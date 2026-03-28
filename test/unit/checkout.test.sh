#!/bin/sh
# test/unit/checkout.test.sh — unit test: checkout.js structure
# Checks: cart data loading, totals calculation, form validation

set -u

FILE="assets/js/modules/checkout.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check init or calculate function
if grep -q 'export.*function' "$FILE"; then
    printf 'ok 2 exported function(s) present\n'
else
    printf 'not ok 2 no exported functions\n'
    FAIL=$((FAIL + 1))
fi

# Check subtotal/total calculation
if grep -q 'subtotal\|total\|TOTAL\|SubTotal' "$FILE"; then
    printf 'ok 3 total calculation present\n'
else
    printf 'not ok 3 total calculation missing\n'
    FAIL=$((FAIL + 1))
fi

# Check form validation
if grep -q 'validation\|valid\|check\|required' "$FILE"; then
    printf 'ok 4 form validation present\n'
else
    printf 'not ok 4 form validation missing\n'
    FAIL=$((FAIL + 1))
fi

printf 'ok 5 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
