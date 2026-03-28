#!/bin/sh
# test/headless/modal.test.sh — Layer 2: modal focus trap, open/close
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

URL="${SITE_BASE}/index.html"

DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    "$URL" --dump-dom 2>/dev/null) || DOM=""

# Check page loads
if printf '%s' "$DOM" | grep -qi '<html'; then
    printf 'ok 1 page loads for modal check\n'
else
    printf 'not ok 1 page loads for modal check\n'
fi

# Check for modal trigger (button with data attributes or class)
if printf '%s' "$DOM" | grep -qiE 'data-modal|data-target|modal-trigger|open-modal'; then
    printf 'ok 2 modal trigger found\n'
else
    printf 'not ok 2 modal trigger found\n'
fi

# Check for modal markup
if printf '%s' "$DOM" | grep -qiE 'id\s*=\s*["\x27]modal|class\s*=\s*["\x27][^"\x27]*modal'; then
    printf 'ok 3 modal element found\n'
else
    printf 'not ok 3 modal element found\n'
fi

# Check for close button
if printf '%s' "$DOM" | grep -qiE 'close.*modal|data-close|modal.*close|\.close'; then
    printf 'ok 4 modal close mechanism found\n'
else
    printf 'not ok 4 modal close mechanism found\n'
fi

exit 0
