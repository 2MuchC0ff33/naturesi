#!/bin/sh
# test/headless/paypal-sdk-flow.test.sh — Headless: PayPal SDK flow
# Purpose: Verify PayPal SDK renders correctly on checkout page
# Requires: apache running (scripts/serve.sh start)

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

CHROMIUM="${CHROMIUM:-chromium}"
if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    CHROMIUM="/snap/bin/chromium"
fi

if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    printf 'ok 1 # skip chromium not found\n'
    exit 0
fi

SITE_BASE="${SITE_BASE_URL:-http://localhost:8000}"
TIMEOUT="${TIMEOUT:-5000}"

HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$SITE_BASE" 2>/dev/null)
if ! printf '%s' "$HTTP_CODE" | grep -qE '^20[0-5]$'; then
    printf 'ok 1 # skip site not reachable at %s\n' "$SITE_BASE"
    exit 0
fi

printf 'TAP version 14\n'

TARGET_URL="${SITE_BASE}/pages/checkout.html"
DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget="$TIMEOUT" \
    "$TARGET_URL" --dump-dom 2>/dev/null) || true

# Test 1: PayPal button container exists
if printf '%s' "$DOM" | grep -qiE 'id="paypal-button-container"'; then
    printf 'ok 1 PayPal button container exists\n'
else
    printf 'not ok 1 PayPal button container exists\n'
    exit 1
fi

# Test 2: Old redirect form does NOT exist
if printf '%s' "$DOM" | grep -qiE '<form[^>]*paypal-redirect-form'; then
    printf 'not ok 2 Old redirect form should not exist\n'
    exit 1
else
    printf 'ok 2 Old redirect form removed (SDK mode)\n'
fi

# Test 3: No debug div in SDK mode
if printf '%s' "$DOM" | grep -qiE 'id="paypal-debug"'; then
    printf 'not ok 3 Debug div should not exist in SDK mode\n'
    exit 1
else
    printf 'ok 3 Debug div removed (SDK mode)\n'
fi

# Test 4: paypal.json has useSdk: true
PAYPAL_JSON="$BASE_DIR/assets/js/data/paypal.json"
SDK_VALUE=$(jq -r '.useSdk // false' "$PAYPAL_JSON" 2>/dev/null)
if [ "$SDK_VALUE" = "true" ]; then
    printf 'ok 4 paypal.json useSdk is true\n'
else
    printf 'not ok 4 paypal.json useSdk is true (got: %s)\n' "$SDK_VALUE"
    exit 1
fi

# Test 5: clientId is set
CLIENT_ID=$(jq -r '.clientId // empty' "$PAYPAL_JSON" 2>/dev/null)
if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "null" ] && [ "$CLIENT_ID" != "" ]; then
    printf 'ok 5 paypal.json clientId is set\n'
else
    printf 'not ok 5 paypal.json clientId is set\n'
    exit 1
fi

printf '\n1..5\n'
exit 0
