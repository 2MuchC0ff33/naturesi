#!/usr/bin/env yash
# test/unit/modal.test.sh — unit test: modal.js structure and exports
# Checks: init function, modal open/close, keyboard trap

set -u

FILE="assets/js/modules/modal.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check init function
if grep -q 'export function init' "$FILE"; then
    printf 'ok 2 init function exported\n'
else
    printf 'not ok 2 init function not exported\n'
    FAIL=$((FAIL + 1))
fi

# Check openModal function
if grep -q 'function openModal' "$FILE"; then
    printf 'ok 3 openModal function present\n'
else
    printf 'not ok 3 openModal not found\n'
    FAIL=$((FAIL + 1))
fi

# Check closeModal function
if grep -q 'function closeModal' "$FILE"; then
    printf 'ok 4 closeModal function present\n'
else
    printf 'not ok 4 closeModal not found\n'
    FAIL=$((FAIL + 1))
fi

# Check focus trap for accessibility
if grep -q 'trapFocus' "$FILE" && grep -q 'addKeyListener' "$FILE"; then
    printf 'ok 5 keyboard focus trap implemented\n'
else
    printf 'not ok 5 keyboard trap missing\n'
    FAIL=$((FAIL + 1))
fi

# Check aria handling
if grep -q 'aria-hidden' "$FILE" && grep -q 'aria-modal' "$FILE"; then
    printf 'ok 6 ARIA attributes handled\n'
else
    printf 'not ok 6 ARIA handling missing\n'
    FAIL=$((FAIL + 1))
fi

# Check body class for scroll lock
if grep -q 'modal-open' "$FILE"; then
    printf 'ok 7 scroll lock via body class\n'
else
    printf 'not ok 7 scroll lock missing\n'
    FAIL=$((FAIL + 1))
fi

printf 'ok 8 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
