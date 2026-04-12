h46377
s 00073/00000/00000
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
# test/headless/cart-icon-visibility.test.sh — Headless: Cart icon visibility
# Purpose: Verify cart icon is visible in the browser
# Requires: apache running (scripts/serve.sh start)

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

CHROMIUM="${CHROMIUM:-chromium}"
if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    CHROMIUM="/snap/bin/chromium"
fi

if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    printf 'ok 1 # skip chromium not found\n'
    exit 0
fi

SITE_BASE="${SITE_BASE_URL:-http://localhost:8000}"
TIMEOUT="${TIMEOUT:-5000}"

# Check site is reachable
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$SITE_BASE" 2>/dev/null)
if ! printf '%s' "$HTTP_CODE" | grep -qE '^20[0-5]$'; then
    printf 'ok 1 # skip site not reachable at %s\n' "$SITE_BASE"
    exit 0
fi

printf 'TAP version 14\n'

# Test on index.html
TARGET_URL="${SITE_BASE}/index.html"
DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget="$TIMEOUT" \
    "$TARGET_URL" --dump-dom 2>/dev/null) || true

# Test 1: Cart element exists
if printf '%s' "$DOM" | grep -qiE 'cart|shopping.*cart|cart.*icon'; then
    printf 'ok 1 cart element exists in DOM\n'
else
    printf 'not ok 1 cart element exists in DOM\n'
    exit 1
fi

# Test 2: Cart is NOT hidden (aria-hidden != true)
if printf '%s' "$DOM" | grep -iE 'cart' | grep -vqi 'aria-hidden="true"'; then
    printf 'ok 2 cart element not hidden by aria-hidden\n'
else
    printf 'not ok 2 cart element not hidden by aria-hidden\n'
    exit 1
fi

# Test 3: Cart has alt text
if printf '%s' "$DOM" | grep -iE '<img[^>]*cart[^>]*alt='; then
    printf 'ok 3 cart image has alt attribute\n'
else
    printf 'not ok 3 cart image has alt attribute\n'
    exit 1
fi

# Test 4: Cart is visible (display != none)
if printf '%s' "$DOM" | grep -iE 'cart' | grep -qviE 'display:\s*none|visibility:\s*hidden'; then
    printf 'ok 4 cart element appears visible\n'
else
    printf 'not ok 4 cart element appears visible\n'
    exit 1
fi

printf '\n1..4\n'
exit 0
E 1
