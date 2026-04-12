h52905
s 00104/00000/00000
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
# test/unit/paypal-sdk-url.test.sh — Unit: PayPal SDK URL validation
# Tests: SDK URL construction from paypal.json values, HTTP 200 from PayPal

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

PAYPAL_JSON="$BASE_DIR/assets/js/data/paypal.json"
FAIL=0
PASS=0

pass() { printf 'ok %d - %s\n' $((PASS + FAIL + 1)) "$1"; PASS=$((PASS + 1)); }
fail() { printf 'not ok %d - %s\n' $((PASS + FAIL + 1)) "$1" >&2; FAIL=$((FAIL + 1)); }

printf 'TAP version 14\n'

# Test 1: paypal.json exists
if [ -f "$PAYPAL_JSON" ]; then
    pass "paypal.json exists"
else
    fail "paypal.json exists"
    printf 'FAIL: paypal.json not found at %s\n' "$PAYPAL_JSON" >&2
    exit 1
fi

# Test 2: Valid JSON
if jq . "$PAYPAL_JSON" >/dev/null 2>&1; then
    pass "paypal.json is valid JSON"
else
    fail "paypal.json is valid JSON"
fi

# Test 3: Intent is lowercase
INTENT=$(jq -r '.intent // empty' "$PAYPAL_JSON")
if echo "$INTENT" | grep -qE '^[a-z]+$'; then
    pass "Intent is lowercase: $INTENT"
else
    fail "Intent is lowercase (got: $INTENT)"
fi

# Test 4: Currency is 3-letter AUD
CURRENCY=$(jq -r '.currency // empty' "$PAYPAL_JSON")
if [ "$CURRENCY" = "AUD" ]; then
    pass "Currency is AUD"
else
    fail "Currency is AUD (got: $CURRENCY)"
fi

# Test 5: clientId format valid
CLIENT_ID=$(jq -r '.clientId // empty' "$PAYPAL_JSON")
if echo "$CLIENT_ID" | grep -qE '^[A-Za-z0-9_-]+$'; then
    pass "clientId format valid"
else
    fail "clientId format valid (got: $CLIENT_ID)"
fi

# Test 6: Construct SDK URL from paypal.json values
SDK_URL="https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=${CURRENCY}&intent=${INTENT}"
if echo "$SDK_URL" | grep -qE '^https://www\.paypal\.com/sdk/js\?client-id=.+&currency=[A-Z]{3}&intent=[a-z]+$'; then
    pass "SDK URL constructed correctly: $SDK_URL"
else
    fail "SDK URL constructed correctly (got: $SDK_URL)"
fi

# Test 7: Curl production SDK URL → HTTP 200
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$SDK_URL" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    pass "SDK URL returns HTTP 200"
else
    fail "SDK URL returns HTTP 200 (got: $HTTP_CODE)"
fi

# Test 8: SDK response is JavaScript (check content-type header)
SDK_CONTENT_TYPE=$(curl -sI "$SDK_URL" 2>/dev/null | grep -i '^content-type:' | head -1)
if echo "$SDK_CONTENT_TYPE" | grep -qi 'application/javascript'; then
    pass "SDK response is JavaScript (content-type: $SDK_CONTENT_TYPE)"
else
    fail "SDK response is JavaScript (got: $SDK_CONTENT_TYPE)"
fi

# Test 9: SDK URL params contain intent=capture
if echo "$SDK_RESPONSE" | grep -q 'intent=capture'; then
    pass "SDK URL params contain intent=capture"
else
    # Also check the raw URL contains intent
    if echo "$SDK_URL" | grep -q 'intent=capture'; then
        pass "SDK URL contains intent=capture"
    else
        fail "SDK URL contains intent=capture (got: $INTENT)"
    fi
fi

TOTAL=$((PASS + FAIL))
printf '\n1..%d\n' "$TOTAL"

if [ "$FAIL" -gt 0 ]; then
    printf 'FAIL: %d test(s) failed\n' "$FAIL" >&2
    exit 1
fi

printf 'PASS: All tests passed\n'
exit 0
E 1
