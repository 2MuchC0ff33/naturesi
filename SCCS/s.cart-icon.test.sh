h44293
s 00089/00000/00000
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
# test/unit/cart-icon.test.sh — TDD: Cart icon visibility check
# Purpose: Verify cart icon is visible (no aria-hidden, proper alt text)
# TDD: Write this test FIRST, then fix the bug

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

FAIL=0
TEST_NUM=1

printf 'TAP version 14\n'

# Find all HTML files with cart-related content
HTML_FILES=$(find "$BASE_DIR" -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/.git/')

# Test 1: No cart icon should have aria-hidden="true"
ARIA_HIDDEN=$(echo "$HTML_FILES" | xargs grep -l 'cart.*aria-hidden="true"' 2>/dev/null || true)
if [ -z "$ARIA_HIDDEN" ]; then
    printf 'ok %d no cart icons with aria-hidden="true"\n' "$TEST_NUM"
else
    printf 'not ok %d no cart icons with aria-hidden="true"\n' "$TEST_NUM"
    printf '  Files with aria-hidden cart: %s\n' "$ARIA_HIDDEN" >&2
    FAIL=$((FAIL + 1))
fi
TEST_NUM=$((TEST_NUM + 1))

# Test 2: Cart icon should have proper alt text
CART_IMG_NO_ALT=$(echo "$HTML_FILES" | xargs grep -E 'cart.*src=.*\.(webp|png|jpg|svg)"[^>]*alt=""' 2>/dev/null || true)
if [ -z "$CART_IMG_NO_ALT" ]; then
    printf 'ok %d cart images have alt text\n' "$TEST_NUM"
else
    printf 'not ok %d cart images have alt text\n' "$TEST_NUM"
    printf '  Files with empty alt: %s\n' "$CART_IMG_NO_ALT" >&2
    FAIL=$((FAIL + 1))
fi
TEST_NUM=$((TEST_NUM + 1))

# Test 3: Check specific pages for cart icon
for PAGE in index.html pages/checkout.html pages/cart.html pages/store.html; do
    PAGE_PATH="$BASE_DIR/$PAGE"
    if [ -f "$PAGE_PATH" ]; then
        if grep -qi 'cart' "$PAGE_PATH"; then
            printf 'ok %d %s contains cart reference\n' "$TEST_NUM" "$PAGE"
        else
            printf 'not ok %d %s contains cart reference\n' "$TEST_NUM" "$PAGE"
            FAIL=$((FAIL + 1))
        fi
        TEST_NUM=$((TEST_NUM + 1))
    fi
done

# Test 4: Cart icon should not be hidden by CSS class
CART_HIDDEN=$(echo "$HTML_FILES" | xargs grep -l 'class="[^"]*hidden[^"]*cart' 2>/dev/null || true)
if [ -z "$CART_HIDDEN" ]; then
    printf 'ok %d no cart icons with hidden class\n' "$TEST_NUM"
else
    printf 'not ok %d no cart icons with hidden class\n' "$TEST_NUM"
    printf '  Files with hidden cart: %s\n' "$CART_HIDDEN" >&2
    FAIL=$((FAIL + 1))
fi
TEST_NUM=$((TEST_NUM + 1))

# Test 5: Cart logo should have visible styling
CART_CSS="$BASE_DIR/assets/css/partials/components/cart.css"
if [ -f "$CART_CSS" ]; then
    if grep -qE 'display:\s*(inline-block|block|flex)' "$CART_CSS"; then
        printf 'ok %d cart CSS has visible display property\n' "$TEST_NUM"
    else
        printf 'not ok %d cart CSS has visible display property\n' "$TEST_NUM"
        FAIL=$((FAIL + 1))
    fi
else
    printf 'ok %d # skip cart.css not found\n' "$TEST_NUM"
fi
TEST_NUM=$((TEST_NUM + 1))

TOTAL_TESTS=$((TEST_NUM - 1))
printf '\n1..%d\n' "$TOTAL_TESTS"

if [ "$FAIL" -gt 0 ]; then
    printf 'FAIL: %d test(s) failed\n' "$FAIL" >&2
    exit 1
fi

printf 'PASS: All tests passed\n'
exit 0
E 1
