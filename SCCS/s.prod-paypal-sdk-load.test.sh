h20105
s 00101/00000/00000
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
# test/headless/prod-paypal-sdk-load.test.sh — Headless: Production SDK validation
# Tests: Production site checkout, paypal.json, SDK URL
# Environment: Tests against https://www.naturesinfusions.com.au

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

PROD_URL="${SITE_BASE:-https://www.naturesinfusions.com.au}"

printf 'TAP version 14\n'
printf '# Production PayPal SDK Load Tests\n\n'

PASS=0
FAIL=0

pass() { printf 'ok %d - %s\n' $((PASS + FAIL + 1)) "$1"; PASS=$((PASS + 1)); }
fail() { printf 'not ok %d - %s\n' $((PASS + FAIL + 1)) "$1" >&2; FAIL=$((FAIL + 1)); }
diag() { printf '# %s\n' "$1"; }

# Test 1: Production site reachable
diag "=== Test 1: Production site reachable ==="
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$PROD_URL" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    pass "Production site reachable (HTTP $HTTP_CODE)"
else
    fail "Production site reachable (got HTTP $HTTP_CODE)"
fi

# Test 2: Checkout page → HTTP 200
diag "=== Test 2: Checkout page exists ==="
CHECKOUT_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$PROD_URL/pages/checkout.html" 2>/dev/null)
if [ "$CHECKOUT_CODE" = "200" ]; then
    pass "Checkout page exists (HTTP $CHECKOUT_CODE)"
else
    fail "Checkout page exists (got HTTP $CHECKOUT_CODE)"
fi

# Test 3: paypal-button-container exists in checkout HTML
diag "=== Test 3: Button container in checkout ==="
CHECKOUT_HTML=$(curl -s -L "$PROD_URL/pages/checkout.html" 2>/dev/null)
if printf '%s' "$CHECKOUT_HTML" | grep -qi 'id="paypal-button-container"'; then
    pass "paypal-button-container exists in checkout"
else
    fail "paypal-button-container exists in checkout"
fi

# Test 4: app.js script exists in checkout HTML
diag "=== Test 4: app.js script in checkout ==="
if printf '%s' "$CHECKOUT_HTML" | grep -qiE 'type="module"[^>]+src="[^"]*app\.js"|src="[^"]*app\.js"[^>]*type="module"'; then
    pass "app.js module script in checkout"
else
    fail "app.js module script in checkout"
fi

# Test 5: paypal.json accessible and valid
diag "=== Test 5: paypal.json accessible ==="
PAYPAL_JSON=$(curl -s -L "$PROD_URL/assets/js/data/paypal.json" 2>/dev/null)
if printf '%s' "$PAYPAL_JSON" | head -1 | grep -q '{'; then
    if echo "$PAYPAL_JSON" | jq . >/dev/null 2>&1; then
        pass "paypal.json is accessible and valid JSON"
    else
        fail "paypal.json is valid JSON"
    fi
else
    fail "paypal.json is accessible"
fi

# Test 6: Intent is lowercase (critical fix)
diag "=== Test 6: Intent is lowercase ==="
INTENT=$(echo "$PAYPAL_JSON" | jq -r '.intent // empty' 2>/dev/null)
if echo "$INTENT" | grep -qE '^[a-z]+$'; then
    pass "Intent is lowercase: $INTENT"
else
    fail "Intent is lowercase (got: $INTENT)"
fi

# Test 7: SDK URL → HTTP 200
diag "=== Test 7: SDK URL returns HTTP 200 ==="
CLIENT_ID=$(echo "$PAYPAL_JSON" | jq -r '.clientId // empty' 2>/dev/null)
CURRENCY=$(echo "$PAYPAL_JSON" | jq -r '.currency // empty' 2>/dev/null)
SDK_URL="https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=${CURRENCY}&intent=${INTENT}"
SDK_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$SDK_URL" 2>/dev/null)
if [ "$SDK_CODE" = "200" ]; then
    pass "SDK URL returns HTTP 200"
else
    fail "SDK URL returns HTTP 200 (got: $SDK_CODE)"
fi

TOTAL=$((PASS + FAIL))
printf '\n1..%d\n' "$TOTAL"
printf '# %d passed, %d failed\n' "$PASS" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi

printf 'PASS: All production SDK tests passed\n'
exit 0
E 1
