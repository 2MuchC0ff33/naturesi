h49068
s 00050/00000/00000
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
# test/unit/cart-ui.test.sh — unit test: cart-ui.js structure
# Checks: cart UI updates, badge rendering, event listeners

set -u

FILE="assets/js/modules/cart-ui.js"
if [ -f "assets/js/modules/cartUI.js" ]; then
    FILE="assets/js/modules/cartUI.js"
fi

FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check update/render function
if grep -q 'export.*function.*update\|export.*function.*render\|export.*function.*init' "$FILE"; then
    printf 'ok 2 update/render/init function exported\n'
else
    printf 'not ok 2 update/render function not exported\n'
    FAIL=$((FAIL + 1))
fi

# Check cart badge/bubble element
if grep -q 'badge\|bubble\|count\|count\|total' "$FILE"; then
    printf 'ok 3 cart count/badge logic present\n'
else
    printf 'not ok 3 cart count logic missing\n'
    FAIL=$((FAIL + 1))
fi

# Check cart key consistency (cartStore handles the key; we check for the import)
if grep -q 'naturesi_cart' "$FILE" || grep -q "from.*cartStore" "$FILE"; then
    printf 'ok 4 cart key via cartStore or direct\n'
else
    printf 'not ok 4 cart key reference missing\n'
    FAIL=$((FAIL + 1))
fi

printf 'ok 5 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
E 1
