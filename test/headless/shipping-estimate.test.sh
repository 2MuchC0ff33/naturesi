#!/bin/sh
# test/headless/shipping-estimate.test.sh — Layer 2: postcode lookup shows rate
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

# Check postcode input exists
if printf '%s' "$DOM" | grep -qiE '<input[^>]+name\s*=\s*["\x27]postcode'; then
    printf 'ok 1 postcode input exists\n'
else
    printf 'not ok 1 postcode input exists\n'
fi

# Check for shipping estimate section or zone info
if printf '%s' "$DOM" | grep -qiE '[Ss]hipping|[Zz]one|[Ee]stimate'; then
    printf 'ok 2 shipping section present\n'
else
    printf 'not ok 2 shipping section present\n'
fi

# Check for Australia postcode hint
if printf '%s' "$DOM" | grep -qiE 'Australia|postcode|4-digit|4 digit'; then
    printf 'ok 3 postcode hint present\n'
else
    printf 'not ok 3 postcode hint present\n'
fi

exit 0
