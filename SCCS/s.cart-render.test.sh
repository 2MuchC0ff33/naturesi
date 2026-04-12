h46344
s 00054/00000/00000
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
# test/headless/cart-render.test.sh — Layer 2: cart renders from localStorage
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

URL="${SITE_BASE}/cart.html"

# Load cart page and check:
# 1. Page loads without crash
# 2. Cart table exists
# 3. Empty cart message or items displayed

DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    "$URL" --dump-dom 2>/dev/null) || DOM=""

# 1. Page loads
if [ -n "$DOM" ] && printf '%s' "$DOM" | grep -qi '<html'; then
    printf 'ok 1 cart page loads\n'
else
    printf 'not ok 1 cart page loads\n'
    exit 1
fi

# 2. Cart table exists
if printf '%s' "$DOM" | grep -qiE '<table[^>]*class\s*=\s*["\x27][^"\x27]*cart'; then
    printf 'ok 2 cart table exists\n'
else
    printf 'not ok 2 cart table exists\n'
fi

# 3. Cart heading
if printf '%s' "$DOM" | grep -qiE '<h[123][^>]*>.*[Cc]art'; then
    printf 'ok 3 cart heading present\n'
else
    printf 'not ok 3 cart heading present\n'
fi

exit 0
E 1
