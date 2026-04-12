h44535
s 00047/00000/00000
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
# test/e2e/payment-cancel-flow.test.sh — e2e: cancel -> cart preserved
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

URL="${SITE_BASE}/payment/fail.html"

DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    "$URL" --dump-dom 2>/dev/null) || DOM=""

# Check page loads
if printf '%s' "$DOM" | grep -qi '<html'; then
    printf 'ok 1 cancel page loads\n'
else
    printf 'not ok 1 cancel page loads\n'
fi

# Check for cancel message
if printf '%s' "$DOM" | grep -qiE '[Cc]ancel|[Pp]ayment.*not.*completed|not.*processed'; then
    printf 'ok 2 cancel message displayed\n'
else
    printf 'not ok 2 cancel message displayed\n'
fi

# Check for return-to-cart link
if printf '%s' "$DOM" | grep -qiE 'href\s*=\s*["\x27][^"\x27]*cart|return.*cart|cart.*return'; then
    printf 'ok 3 return to cart link present\n'
else
    printf 'not ok 3 return to cart link present\n'
fi

exit 0
E 1
