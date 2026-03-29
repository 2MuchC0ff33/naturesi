#!/bin/sh
# test/e2e/checkout-to-paypal.test.sh — e2e: checkout form -> PayPal form fields populated
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

URL="${SITE_BASE}/checkout.html"

DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    "$URL" --dump-dom 2>/dev/null) || DOM=""

# Check PayPal redirect form has required fields
if printf '%s' "$DOM" | grep -qiE 'input\s+name\s*=\s*["\x27]business'; then
    printf 'ok 1 PayPal business input present\n'
else
    printf 'not ok 1 PayPal business input present\n'
fi

if printf '%s' "$DOM" | grep -qiE 'input\s+name\s*=\s*["\x27]amount'; then
    printf 'ok 2 PayPal amount input present\n'
else
    printf 'not ok 2 PayPal amount input present\n'
fi

if printf '%s' "$DOM" | grep -qiE 'input\s+name\s*=\s*["\x27]item_name'; then
    printf 'ok 3 PayPal item_name input present\n'
else
    printf 'not ok 3 PayPal item_name input present\n'
fi

if printf '%s' "$DOM" | grep -qiE 'input\s+name\s*=\s*["\x27]return'; then
    printf 'ok 4 PayPal return URL input present\n'
else
    printf 'not ok 4 PayPal return URL input present\n'
fi

if printf '%s' "$DOM" | grep -qiE 'input\s+name\s*=\s*["\x27]cancel_return'; then
    printf 'ok 5 PayPal cancel_return URL input present\n'
else
    printf 'not ok 5 PayPal cancel_return URL input present\n'
fi

exit 0
