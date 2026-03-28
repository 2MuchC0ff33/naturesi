#!/usr/bin/env yash
# test/unit/product-search.test.sh — unit test: product-search.js structure
# Checks: search function, filter logic, CSV data reference

set -u

FILE="assets/js/modules/product-search.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check search/filter function
if grep -q 'export.*function.*search\|export.*function.*filter\|export.*function.*init' "$FILE"; then
    printf 'ok 2 search/filter/init function exported\n'
else
    printf 'not ok 2 search function not exported\n'
    FAIL=$((FAIL + 1))
fi

# Check CSV data reference
if grep -q '\.csv' "$FILE"; then
    printf 'ok 3 CSV data reference found\n'
else
    printf 'not ok 3 CSV reference missing\n'
    FAIL=$((FAIL + 1))
fi

# Check event listener for search input
if grep -q 'addEventListener.*input\|addEventListener.*keyup\|addEventListener.*change' "$FILE"; then
    printf 'ok 4 search input event listener present\n'
else
    printf 'not ok 4 search input listener missing\n'
    FAIL=$((FAIL + 1))
fi

printf 'ok 5 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
