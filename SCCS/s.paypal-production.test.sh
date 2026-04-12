h40079
s 00150/00000/00000
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
# test/unit/paypal-production.test.sh — TDD: PayPal production credentials check (SDK mode)
# Purpose: Verify paypal.json has correct SDK production configuration

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

PAYPAL_JSON="$BASE_DIR/assets/js/data/paypal.json"
FAIL=0

printf 'TAP version 14\n'

# Test 1: paypal.json exists
if [ -f "$PAYPAL_JSON" ]; then
    printf 'ok 1 paypal.json exists\n'
else
    printf 'not ok 1 paypal.json exists\n'
    printf 'FAIL: paypal.json not found at %s\n' "$PAYPAL_JSON" >&2
    exit 1
fi

# Test 2: Valid JSON
if jq . "$PAYPAL_JSON" >/dev/null 2>&1; then
    printf 'ok 2 paypal.json is valid JSON\n'
else
    printf 'not ok 2 paypal.json is valid JSON\n'
    FAIL=$((FAIL + 1))
fi

# Test 3: .env is "production"
ENV_VALUE=$(jq -r '.env // empty' "$PAYPAL_JSON")
if [ "$ENV_VALUE" = "production" ]; then
    printf 'ok 3 .env is "production"\n'
else
    printf 'not ok 3 .env is "production" (got: %s)\n' "$ENV_VALUE"
    FAIL=$((FAIL + 1))
fi

# Test 4: useSdk is true
SDK_VALUE=$(jq -r '.useSdk // empty' "$PAYPAL_JSON")
if [ "$SDK_VALUE" = "true" ]; then
    printf 'ok 4 .useSdk is true (SDK mode enabled)\n'
else
    printf 'not ok 4 .useSdk is true (got: %s)\n' "$SDK_VALUE"
    FAIL=$((FAIL + 1))
fi

# Test 5: clientId is set and not example.com or empty
CLIENT_ID=$(jq -r '.clientId // empty' "$PAYPAL_JSON")
if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "null" ] && [ "$CLIENT_ID" != "" ]; then
    if echo "$CLIENT_ID" | grep -qv 'example.com'; then
        printf 'ok 5 .clientId is set to real value\n'
    else
        printf 'not ok 5 .clientId is set to real value (got: %s)\n' "$CLIENT_ID"
        FAIL=$((FAIL + 1))
    fi
else
    printf 'not ok 5 .clientId is set\n'
    FAIL=$((FAIL + 1))
fi

# Test 6: merchantId is set
MERCHANT_ID=$(jq -r '.merchantId // empty' "$PAYPAL_JSON")
if [ -n "$MERCHANT_ID" ] && [ "$MERCHANT_ID" != "null" ]; then
    printf 'ok 6 .merchantId is set: %s\n' "$MERCHANT_ID"
else
    printf 'not ok 6 .merchantId is set\n'
    FAIL=$((FAIL + 1))
fi

# Test 7: email is still set (for receipts)
EMAIL=$(jq -r '.email // empty' "$PAYPAL_JSON")
if [ -n "$EMAIL" ] && [ "$EMAIL" != "null" ]; then
    if echo "$EMAIL" | grep -qv 'example.com'; then
        printf 'ok 7 .email is set to real address: %s\n' "$EMAIL"
    else
        printf 'not ok 7 .email is set to real address (got: %s)\n' "$EMAIL"
        FAIL=$((FAIL + 1))
    fi
else
    printf 'not ok 7 .email is set\n'
    FAIL=$((FAIL + 1))
fi

# Test 8: .sandboxMerchant should NOT exist in production mode
SANDBOX=$(jq -r '.sandboxMerchant // empty' "$PAYPAL_JSON")
if [ -z "$SANDBOX" ] || [ "$SANDBOX" = "null" ] || [ "$SANDBOX" = "" ]; then
    printf 'ok 8 .sandboxMerchant not present in production mode\n'
else
    printf 'not ok 8 .sandboxMerchant not present in production mode (found: %s)\n' "$SANDBOX"
    FAIL=$((FAIL + 1))
fi

# Test 9: currency is AUD
CURRENCY=$(jq -r '.currency // empty' "$PAYPAL_JSON")
if [ "$CURRENCY" = "AUD" ]; then
    printf 'ok 9 .currency is AUD\n'
else
    printf 'not ok 9 .currency is AUD (got: %s)\n' "$CURRENCY"
    FAIL=$((FAIL + 1))
fi

# Test 10: intent is lowercase "capture"
INTENT=$(jq -r '.intent // empty' "$PAYPAL_JSON")
if [ "$INTENT" = "capture" ]; then
    printf 'ok 10 .intent is lowercase "capture"\n'
else
    printf 'not ok 10 .intent is lowercase "capture" (got: %s)\n' "$INTENT"
    FAIL=$((FAIL + 1))
fi

# Test 11: intent is lowercase (regex check)
if echo "$INTENT" | grep -qE '^[a-z]+$'; then
    printf 'ok 11 .intent is lowercase (regex)\n'
else
    printf 'not ok 11 .intent is lowercase (got: %s)\n' "$INTENT"
    FAIL=$((FAIL + 1))
fi

# Test 12: Construct SDK URL from paypal.json values
CLIENT_ID=$(jq -r '.clientId // empty' "$PAYPAL_JSON")
CURRENCY=$(jq -r '.currency // empty' "$PAYPAL_JSON")
SDK_URL="https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=${CURRENCY}&intent=${INTENT}"
if echo "$SDK_URL" | grep -qE '^https://www\.paypal\.com/sdk/js\?client-id=.+&currency=[A-Z]{3}&intent=[a-z]+$'; then
    printf 'ok 12 SDK URL constructed correctly\n'
else
    printf 'not ok 12 SDK URL constructed correctly\n'
    FAIL=$((FAIL + 1))
fi

# Test 13: Validate with jq script
if jq -f "$BASE_DIR/scripts/jq/validate-paypal.jq" "$PAYPAL_JSON" 2>/dev/null | grep -q "OK"; then
    printf 'ok 13 passes validate-paypal.jq checks\n'
else
    printf 'not ok 13 passes validate-paypal.jq checks\n'
    jq -f "$BASE_DIR/scripts/jq/validate-paypal.jq" "$PAYPAL_JSON" 2>&1 >&2
    FAIL=$((FAIL + 1))
fi

printf '\n1..13\n'

if [ "$FAIL" -gt 0 ]; then
    printf 'FAIL: %d test(s) failed\n' "$FAIL" >&2
    exit 1
fi

printf 'PASS: All tests passed\n'
exit 0
E 1
