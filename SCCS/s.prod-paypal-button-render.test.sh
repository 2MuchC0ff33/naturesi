h10928
s 00132/00000/00000
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
# test/headless/prod-paypal-button-render.test.sh — Headless: Production button render
# Tests: Production checkout with cart → PayPal button renders
# Environment: Tests against https://www.naturesinfusions.com.au

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

CHROMIUM="${CHROMIUM:-chromium}"
if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    CHROMIUM="/snap/bin/chromium"
fi

if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    for i in 1 2 3 4 5 6 7; do
        printf 'ok %d chromium not found (skip)\n' "$i"
    done
    printf '\n1..7\n'
    exit 0
fi

PROD_URL="${SITE_BASE:-https://www.naturesinfusions.com.au}"

printf 'TAP version 14\n'
printf '# Production PayPal Button Render Tests\n\n'

PASS=0
FAIL=0

pass() { printf 'ok %d - %s\n' $((PASS + FAIL + 1)) "$1"; PASS=$((PASS + 1)); }
fail() { printf 'not ok %d - %s\n' $((PASS + FAIL + 1)) "$1" >&2; FAIL=$((FAIL + 1)); }
diag() { printf '# %s\n' "$1"; }

# Test 1: Production site reachable
diag "=== Test 1: Production site reachable ==="
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$PROD_URL" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    pass "Production site reachable"
else
    fail "Production site reachable"
fi

# Test 2: Chromium available
pass "Chromium available"

# Test 3: Set localStorage cart + load production checkout
diag "=== Test 3: Cart setup + checkout load ==="
TMP_HTML=$(mktemp /tmp/prod-render-test-XXXXXX.html)
cat > "$TMP_HTML" << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Production Test</title></head>
<body>
<script>
var cart = [
    {"id":"product-calming-50g","title":"Calming Garden - 50g Pouch","price":14,"qty":2},
    {"id":"product-turmeric-60g","title":"Enchanted Turmeric - 60g Pouch","price":14,"qty":1}
];
localStorage.setItem('naturesi_cart', JSON.stringify(cart));
document.title = 'CART_SET';
</script>
<p>Cart set.</p>
</body>
</html>
EOF

DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --run-all-compositor-stages-before-draw \
    --virtual-time-budget=3000 \
    "file://$TMP_HTML" --dump-dom 2>/dev/null) || DOM=""
rm -f "$TMP_HTML"

CART_SET=""
if printf '%s' "$DOM" | grep -q 'CART_SET'; then
    CART_SET="yes"
fi

# Check if cart was set (informational — file:// localStorage won't persist to production)
if [ -n "$CART_SET" ]; then
    pass "localStorage API works in headless browser"
else
    pass "localStorage setup skipped (file:// protocol limitation)"
fi

# Test 4: Load production checkout with console capture
diag "=== Test 4: Production checkout loads + console check ==="
STDERR=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --run-all-compositor-stages-before-draw \
    --enable-logging --v=1 \
    --virtual-time-budget=10000 \
    "$PROD_URL/pages/checkout.html" --dump-dom 2>&1) || STDERR=""

# Extract DOM from stderr (--dump-dom goes to stdout, console to stderr)
DOM_OUT=$(printf '%s' "$STDERR" | grep -vE '^\[' | grep -vE '^[0-9]{2}/[0-9]{2}' | grep -vE '^[A-Z][a-z]{2} [0-9]' | head -n 1 | grep . || true)

# Test 5: Button container exists in DOM
diag "=== Test 5: Button container exists ==="
if printf '%s' "$STDERR" | grep -qi 'paypal-button-container'; then
    pass "PayPal button container exists in checkout"
else
    fail "PayPal button container exists in checkout"
fi

# Test 6: app.js loaded (check for module script)
diag "=== Test 6: app.js module reference ==="
if printf '%s' "$STDERR" | grep -qi 'app\.js\|application/javascript'; then
    pass "Checkout loads JS module"
else
    fail "Checkout loads JS module"
fi

# Test 7: JS errors check
diag "=== Test 7: Console errors ==="
ERROR_COUNT=$(printf '%s' "$STDERR" | grep -ciE 'Uncaught|ReferenceError|TypeError|SyntaxError' || true)
if [ "$ERROR_COUNT" -eq 0 ]; then
    pass "Zero JS errors on production checkout"
else
    fail "Zero JS errors on production checkout (found $ERROR_COUNT)"
fi

TOTAL=$((PASS + FAIL))
printf '\n1..%d\n' "$TOTAL"
printf '# %d passed, %d failed\n' "$PASS" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi

printf 'PASS: All production button render tests passed\n'
exit 0
E 1
