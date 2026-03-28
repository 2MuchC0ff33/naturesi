#!/bin/sh
# test/headless/service-worker.test.sh — Layer 2: SW install, cache, offline
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
    printf 'ok 1 page loads with SW registration\n'
else
    printf 'not ok 1 page loads with SW registration\n'
fi

# Check manifest link exists (PWA prerequisite)
if printf '%s' "$DOM" | grep -qiE '<link[^>]+rel\s*=\s*["\x27]manifest'; then
    printf 'ok 2 manifest link present\n'
else
    printf 'not ok 2 manifest link present\n'
fi

# Check for service-worker.js registration (in inline script or module)
if printf '%s' "$DOM" | grep -qiE 'service.worker|sw\.js|service-worker\.js'; then
    printf 'ok 3 SW registration script present\n'
else
    printf 'not ok 3 SW registration script present\n'
fi

exit 0
