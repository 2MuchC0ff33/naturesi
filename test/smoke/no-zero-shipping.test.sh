#!/bin/sh
# test/smoke/no-zero-shipping.test.sh — regression test: prevent $0 shipping bug
# Ensures: create-order.php always requires shipping > 0

set -u

# Check if server is running
if ! curl -s --connect-timeout 2 http://localhost:8000/api/create-order.php >/dev/null 2>&1; then
    echo "ok 1 server not running (skip)"
    echo "2..0"
    exit 0
fi

BASE_URL="${BASE_URL:-http://localhost:8000}"
API_URL="$BASE_URL/api/create-order.php"

echo "TAP version 14"
echo "Testing: $API_URL"

# Test 1: Missing shipping should be rejected
RESPONSE1=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"id":"product-calming","qty":1}],"total":"14.00","currency":"AUD","postcode":"6147"}' 2>/dev/null)

if echo "$RESPONSE1" | grep -qi "error\|shipping"; then
    echo "ok 1 - missing shipping rejected"
else
    echo "not ok 1 - missing shipping accepted: $RESPONSE1"
fi

# Test 2: shipping=0 should be rejected
RESPONSE2=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"id":"product-calming","qty":1}],"total":"14.00","shipping":"0.00","currency":"AUD","postcode":"6147"}' 2>/dev/null)

if echo "$RESPONSE2" | grep -qi "greater than zero\|must be greater"; then
    echo "ok 2 - shipping=0 rejected"
else
    echo "not ok 2 - shipping=0 accepted: $RESPONSE2"
fi

# Test 3: shipping < 0 should be rejected
RESPONSE3=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"id":"product-calming","qty":1}],"total":"14.00","shipping":"-5.00","currency":"AUD","postcode":"6147"}' 2>/dev/null)

if echo "$RESPONSE3" | grep -qi "error\|shipping"; then
    echo "ok 3 - negative shipping rejected"
else
    echo "not ok 3 - negative shipping accepted: $RESPONSE3"
fi

# Test 4: Valid shipping should be accepted (fails at PayPal, not validation)
RESPONSE4=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"id":"product-calming","qty":1}],"total":"27.00","shipping":"13.00","currency":"AUD","postcode":"6147"}' 2>/dev/null)

# Should NOT contain shipping validation errors
if ! echo "$RESPONSE4" | grep -qi "shipping.*greater\|must be greater"; then
    echo "ok 4 - valid shipping passes validation"
else
    echo "not ok 4 - valid shipping rejected: $RESPONSE4"
fi

echo ""
echo "1..4"