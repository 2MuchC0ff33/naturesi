#!/bin/sh
# test/headless/search.test.sh — Layer 2: search filtering
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

URL="${SITE_BASE}/search.html"

DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    "$URL" --dump-dom 2>/dev/null) || DOM=""

# Check page loads
if printf '%s' "$DOM" | grep -qi '<html'; then
    printf 'ok 1 search page loads\n'
else
    printf 'not ok 1 search page loads\n'
fi

# Check for search input
if printf '%s' "$DOM" | grep -qiE '<input[^>]+type\s*=\s*["\x27]search'; then
    printf 'ok 2 search input present\n'
else
    printf 'not ok 2 search input present\n'
fi

# Check for search results container
if printf '%s' "$DOM" | grep -qiE 'class\s*=\s*["\x27][^"\x27]*result|class\s*=\s*["\x27][^"\x27]*product'; then
    printf 'ok 3 results container present\n'
else
    printf 'not ok 3 results container present\n'
fi

# Check for label
if printf '%s' "$DOM" | grep -qiE '<label[^>]+for\s*=\s*["\x27][^"\x27]*search'; then
    printf 'ok 4 search label present\n'
else
    printf 'not ok 4 search label present\n'
fi

exit 0
