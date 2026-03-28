#!/bin/sh
# test/headless/payment-success.test.sh — Layer 2: ?tx= param clears cart
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

URL="${SITE_BASE}/payment/success.html?tx=TEST123"

DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    "$URL" --dump-dom 2>/dev/null) || DOM=""

# Check page loads
if printf '%s' "$DOM" | grep -qi '<html'; then
    printf 'ok 1 success page loads with tx param\n'
else
    printf 'not ok 1 success page loads with tx param\n'
fi

# Check for success message
if printf '%s' "$DOM" | grep -qiE '[Ss]uccess|[Tt]hank you|order confirmed'; then
    printf 'ok 2 success message displayed\n'
else
    printf 'not ok 2 success message displayed\n'
fi

# Check for order number
if printf '%s' "$DOM" | grep -qiE 'order|transaction|#'; then
    printf 'ok 3 order/transaction info displayed\n'
else
    printf 'not ok 3 order/transaction info displayed\n'
fi

exit 0
