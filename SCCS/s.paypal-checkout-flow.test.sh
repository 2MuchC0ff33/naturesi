h22281
s 00102/00000/00000
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
# test/e2e/paypal-checkout-flow.test.sh — e2e: PayPal SDK checkout flow
# Checks: SDK config (local), structural checks (production)
# Production checks verify pages exist; local checks verify SDK config correctness

PROD_URL="${SITE_BASE:-https://www.naturesinfusions.com.au}"
FAIL=0

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

printf 'TAP version 14\n'

# Test 1: Site reachable
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$PROD_URL" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    printf 'ok 1 Production site reachable (HTTP %s)\n' "$HTTP_CODE"
else
    printf 'not ok 1 Production site reachable (got HTTP %s)\n' "$HTTP_CODE"
    FAIL=$((FAIL + 1))
fi

# Test 2: Checkout page exists
CHECKOUT_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$PROD_URL/pages/checkout.html" 2>/dev/null)
if [ "$CHECKOUT_CODE" = "200" ]; then
    printf 'ok 2 Checkout page exists\n'
else
    printf 'not ok 2 Checkout page exists\n'
    FAIL=$((FAIL + 1))
fi

# Test 3: PayPal button container exists (check local checkout.html)
if grep -q 'id="paypal-button-container"' "$BASE_DIR/pages/checkout.html" 2>/dev/null; then
    printf 'ok 3 PayPal SDK button container exists in local checkout.html\n'
else
    printf 'not ok 3 PayPal SDK button container exists in local checkout.html\n'
    FAIL=$((FAIL + 1))
fi

# Test 4: Old redirect form does NOT exist (check local checkout.html)
if grep -q 'id="paypal-redirect-form"' "$BASE_DIR/pages/checkout.html" 2>/dev/null; then
    printf 'not ok 4 Old redirect form should not exist in local checkout.html\n'
    FAIL=$((FAIL + 1))
else
    printf 'ok 4 Old redirect form removed from local checkout.html (SDK mode)\n'
fi

# Test 5: paypal.json has useSdk: true (check local config)
PAYPAL_JSON="$BASE_DIR/assets/js/data/paypal.json"
SDK_VALUE=$(jq -r '.useSdk // false' "$PAYPAL_JSON" 2>/dev/null)
if [ "$SDK_VALUE" = "true" ]; then
    printf 'ok 5 paypal.json useSdk is true (local config)\n'
else
    printf 'not ok 5 paypal.json useSdk is true (got: %s)\n' "$SDK_VALUE"
    FAIL=$((FAIL + 1))
fi

# Test 6: paypal.json has env=production (local)
ENV_VALUE=$(jq -r '.env // empty' "$PAYPAL_JSON" 2>/dev/null)
if [ "$ENV_VALUE" = "production" ]; then
    printf 'ok 6 paypal.json env is production\n'
else
    printf 'not ok 6 paypal.json env is production (got: %s)\n' "$ENV_VALUE"
    FAIL=$((FAIL + 1))
fi

# Test 7: clientId is set (local)
CLIENT_ID=$(jq -r '.clientId // empty' "$PAYPAL_JSON" 2>/dev/null)
if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "null" ] && [ "$CLIENT_ID" != "" ]; then
    printf 'ok 7 paypal.json clientId is set\n'
else
    printf 'not ok 7 paypal.json clientId is set\n'
    FAIL=$((FAIL + 1))
fi

# Test 8: Success page exists
SUCCESS_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$PROD_URL/pages/payment/success.html" 2>/dev/null)
if [ "$SUCCESS_CODE" = "200" ]; then
    printf 'ok 8 Payment success page exists\n'
else
    printf 'not ok 8 Payment success page exists\n'
    FAIL=$((FAIL + 1))
fi

# Test 9: Fail page exists
FAIL_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$PROD_URL/pages/payment/fail.html" 2>/dev/null)
if [ "$FAIL_CODE" = "200" ]; then
    printf 'ok 9 Payment fail page exists\n'
else
    printf 'not ok 9 Payment fail page exists\n'
    FAIL=$((FAIL + 1))
fi

printf '\n1..9\n'

if [ "$FAIL" -gt 0 ]; then
    printf 'FAIL: %d test(s) failed\n' "$FAIL" >&2
    exit 1
fi

printf 'PASS: All tests passed\n'
exit 0
E 1
