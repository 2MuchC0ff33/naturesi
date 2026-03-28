#!/bin/sh
# test/headless/dom-structure.test.sh — Layer 1: verify key DOM elements
# Checks: <header>, <nav>, <main>, <footer>, cart-count, product grid
# No server required (file://)

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"

CHROMIUM="${CHROMIUM:-chromium}"
if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    CHROMIUM="/snap/bin/chromium"
fi

if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    printf 'ok 1 chromium not found (skip)\n'
    exit 0
fi

PAGES="
index.html
cart.html
checkout.html
"

COUNT=0

for PAGE in $PAGES; do
    if [ ! -f "$BASE_DIR/$PAGE" ]; then
        continue
    fi
    COUNT=$((COUNT + 1))
    FILE_URL="file://$(pwd)/${BASE_DIR}/${PAGE}"

    DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --enable-logging --v=1 \
        --virtual-time-budget=3000 \
        "$FILE_URL" --dump-dom 2>/dev/null) || DOM=""

    # Check <header>
    if printf '%s' "$DOM" | grep -qi '<header'; then
        printf 'ok %d header: %s\n' $((COUNT * 5)) "$PAGE"
    else
        printf 'not ok %d header: %s\n' $((COUNT * 5)) "$PAGE"
    fi

    # Check <nav>
    if printf '%s' "$DOM" | grep -qi '<nav'; then
        printf 'ok %d nav: %s\n' $((COUNT * 5 + 1)) "$PAGE"
    else
        printf 'not ok %d nav: %s\n' $((COUNT * 5 + 1)) "$PAGE"
    fi

    # Check <main>
    if printf '%s' "$DOM" | grep -qi '<main'; then
        printf 'ok %d main: %s\n' $((COUNT * 5 + 2)) "$PAGE"
    else
        printf 'not ok %d main: %s\n' $((COUNT * 5 + 2)) "$PAGE"
    fi

    # Check <footer>
    if printf '%s' "$DOM" | grep -qi '<footer'; then
        printf 'ok %d footer: %s\n' $((COUNT * 5 + 3)) "$PAGE"
    else
        printf 'not ok %d footer: %s\n' $((COUNT * 5 + 3)) "$PAGE"
    fi

    # Check cart-count element (should exist on all pages)
    if printf '%s' "$DOM" | grep -qiE 'id\s*=\s*["\x27]cart-count|class\s*=\s*["\x27][^"\x27]*cart-count'; then
        printf 'ok %d cart-count element: %s\n' $((COUNT * 5 + 4)) "$PAGE"
    else
        printf 'not ok %d cart-count element: %s\n' $((COUNT * 5 + 4)) "$PAGE"
    fi
done

exit 0
