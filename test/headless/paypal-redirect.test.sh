#!/bin/sh
# test/headless/paypal-redirect.test.sh — Layer 2: form action = PayPal URL
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

# Check form action contains PayPal URL
if printf '%s' "$DOM" | grep -qiE 'action\s*=\s*["\x27]https://www\.paypal\.com'; then
    printf 'ok 1 PayPal form action (production)\n'
elif printf '%s' "$DOM" | grep -qiE 'action\s*=\s*["\x27]https://www\.sandbox\.paypal\.com'; then
    printf 'ok 1 PayPal form action (sandbox)\n'
else
    printf 'not ok 1 PayPal form action\n'
fi

# Check form has business/email field for PayPal
if printf '%s' "$DOM" | grep -qiE 'name\s*=\s*["\x27]business'; then
    printf 'ok 2 PayPal business field present\n'
else
    printf 'not ok 2 PayPal business field present\n'
fi

# Check form has cmd field
if printf '%s' "$DOM" | grep -qiE 'name\s*=\s*["\x27]cmd'; then
    printf 'ok 3 PayPal cmd field present\n'
else
    printf 'not ok 3 PayPal cmd field present\n'
fi

exit 0
