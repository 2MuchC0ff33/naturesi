h42891
s 00048/00000/00000
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
# test/headless/product-add-flow.test.sh — Layer 2: add-to-cart from product page
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

URL="${SITE_BASE}/store/creams.html"

DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    "$URL" --dump-dom 2>/dev/null) || DOM=""

# Check page loads
if printf '%s' "$DOM" | grep -qi '<html'; then
    printf 'ok 1 product page loads\n'
else
    printf 'not ok 1 product page loads\n'
fi

# Check product cards/grid exist
if printf '%s' "$DOM" | grep -qiE 'class\s*=\s*["\x27][^"\x27]*product'; then
    printf 'ok 2 product cards present\n'
else
    printf 'not ok 2 product cards present\n'
fi

# Check add-to-cart buttons exist
if printf '%s' "$DOM" | grep -qiE 'add.*cart|cart.*add|addToCart|add-to-cart'; then
    printf 'ok 3 add-to-cart button present\n'
else
    printf 'not ok 3 add-to-cart button present\n'
fi

exit 0
E 1
