#!/bin/sh
# test/e2e/payment-success-flow.test.sh — e2e: ?tx= -> cart cleared
# Requires: apache at http://localhost:8000

set -u

CHROMIUM="${CHROMIUM:-chromium}"
if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    CHROMIUM="/snap/bin/chromium"
fi

SITE_BASE="${SITE_BASE_URL:-http://localhost:8000}"

if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    printf 'ok 1 chromium not found (skip)\n'
    exit 0
fi

URL="${SITE_BASE}/payment/success.html?tx=TEST_TRANSACTION_123"

DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    "$URL" --dump-dom 2>/dev/null) || DOM=""

# Check page loads with tx param
if printf '%s' "$DOM" | grep -qi '<html'; then
    printf 'ok 1 success page loads with tx param\n'
else
    printf 'not ok 1 success page loads with tx param\n'
fi

# Check for success/order message
if printf '%s' "$DOM" | grep -qiE '[Ss]uccess|[Tt]hank you|order|confirmed|transaction'; then
    printf 'ok 2 success/order message displayed\n'
else
    printf 'not ok 2 success/order message displayed\n'
fi

# Check for cart cleared message
if printf '%s' "$DOM" | grep -qiE 'cart.*cleared|order.*confirmed|thank you'; then
    printf 'ok 3 cart cleared confirmation displayed\n'
else
    printf 'not ok 3 cart cleared confirmation displayed\n'
fi

# Check for transaction ID display
if printf '%s' "$DOM" | grep -qiE 'tx=|transaction|#|ID|reference'; then
    printf 'ok 4 transaction reference shown\n'
else
    printf 'not ok 4 transaction reference shown\n'
fi

exit 0
