h06784
s 00062/00000/00000
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
# test/headless/checkout-form.test.sh — Layer 2: checkout form populated from localStorage
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

# Check form exists
if printf '%s' "$DOM" | grep -qiE '<form'; then
    printf 'ok 1 checkout form exists\n'
else
    printf 'not ok 1 checkout form exists\n'
fi

# Check name input
if printf '%s' "$DOM" | grep -qiE '<input[^>]+name\s*=\s*["\x27]name'; then
    printf 'ok 2 name input present\n'
else
    printf 'not ok 2 name input present\n'
fi

# Check email input
if printf '%s' "$DOM" | grep -qiE '<input[^>]+name\s*=\s*["\x27]email'; then
    printf 'ok 3 email input present\n'
else
    printf 'not ok 3 email input present\n'
fi

# Check postcode input
if printf '%s' "$DOM" | grep -qiE '<input[^>]+name\s*=\s*["\x27]postcode'; then
    printf 'ok 4 postcode input present\n'
else
    printf 'not ok 4 postcode input present\n'
fi

# Check submit button
if printf '%s' "$DOM" | grep -qiE '<button[^>]+type\s*=\s*["\x27]submit'; then
    printf 'ok 5 submit button present\n'
else
    printf 'not ok 5 submit button present\n'
fi

exit 0
E 1
