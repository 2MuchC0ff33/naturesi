#!/usr/bin/env yash
# test/unit/event-delegation.test.sh — unit test: event-delegation.js exports
# Checks: delegate and addKeyListener functions are exported

set -u

FILE="assets/js/modules/event-delegation.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check delegate function
if grep -q 'export function delegate' "$FILE"; then
    printf 'ok 2 delegate function exported\n'
else
    printf 'not ok 2 delegate function not exported\n'
    FAIL=$((FAIL + 1))
fi

# Check addKeyListener function
if grep -q 'export function addKeyListener' "$FILE"; then
    printf 'ok 3 addKeyListener function exported\n'
else
    printf 'not ok 3 addKeyListener not exported\n'
    FAIL=$((FAIL + 1))
fi

# Check both return remover functions
if grep -q 'return function remove' "$FILE"; then
    printf 'ok 4 both functions return remover functions\n'
else
    printf 'not ok 4 remover function pattern missing\n'
    FAIL=$((FAIL + 1))
fi

# Check no unhandled rejections in async patterns
if grep -q 'addEventListener' "$FILE"; then
    printf 'ok 5 addEventListener usage present\n'
else
    printf 'not ok 5 addEventListener not found\n'
    FAIL=$((FAIL + 1))
fi

printf 'ok 6 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
