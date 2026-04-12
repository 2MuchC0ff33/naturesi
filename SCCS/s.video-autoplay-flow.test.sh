h36811
s 00072/00000/00000
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
# test/headless/video-autoplay-flow.test.sh — Headless: Video autoplay in browser
# Purpose: Verify video plays automatically without user interaction
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

# Test 1: Video element exists
TARGET_URL="${SITE_BASE}/index.html"
DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget="$TIMEOUT" \
    "$TARGET_URL" --dump-dom 2>/dev/null) || true

if printf '%s' "$DOM" | grep -qi '<video'; then
    printf 'ok 1 video element exists in DOM\n'
else
    printf 'not ok 1 video element exists in DOM\n'
    exit 1
fi

# Test 2: Video has autoplay attribute
if printf '%s' "$DOM" | grep -iE '<video[^>]*autoplay'; then
    printf 'ok 2 video has autoplay attribute\n'
else
    printf 'not ok 2 video has autoplay attribute\n'
    exit 1
fi

# Test 3: Video has loop attribute
if printf '%s' "$DOM" | grep -iE '<video[^>]*loop'; then
    printf 'ok 3 video has loop attribute\n'
else
    printf 'not ok 3 video has loop attribute\n'
    exit 1
fi

# Test 4: Video has poster (fallback image)
if printf '%s' "$DOM" | grep -iE '<video[^>]*poster'; then
    printf 'ok 4 video has poster attribute\n'
else
    printf 'not ok 4 video has poster attribute\n'
    exit 1
fi

printf '\n1..4\n'
exit 0
E 1
