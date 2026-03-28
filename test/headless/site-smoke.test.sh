#!/bin/sh
# test/headless/site-smoke.test.sh — Layer 1: load every HTML page, no crash
# No server required (file://)
# TAP output: ok/not ok

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

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

find "$BASE_DIR" -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/.git/' > "$TMP"

TOTAL=$(wc -l < "$TMP" | tr -d ' ')
COUNT=0

if [ "$TOTAL" -eq 0 ] 2>/dev/null; then
    printf 'ok 1 no HTML files found (skip)\n'
    exit 0
fi

printf 'ok 1 found %d HTML page(s)\n' "$TOTAL"

while IFS= read -r PAGE || [ -n "$PAGE" ]; do
    COUNT=$((COUNT + 1))

    # Use file:// URL
    FILE_URL="file://$(pwd)/${PAGE}"

    # Run chromium headless, dump DOM, capture any error output
    DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --enable-logging --v=1 \
        --virtual-time-budget=3000 \
        "$FILE_URL" --dump-dom 2>/dev/null) || true

    # Check page loaded (has DOCTYPE)
    if printf '%s' "$DOM" | grep -qi '^<!doctype html>'; then
        printf 'ok %d page loaded: %s\n' $((COUNT * 3)) "$PAGE"
    else
        printf 'not ok %d page loaded: %s\n' $((COUNT * 3)) "$PAGE"
    fi

    # Check has <html>
    if printf '%s' "$DOM" | grep -qi '<html'; then
        printf 'ok %d has html element: %s\n' $((COUNT * 3 + 1)) "$PAGE"
    else
        printf 'not ok %d has html element: %s\n' $((COUNT * 3 + 1)) "$PAGE"
    fi

    # Check has <body>
    if printf '%s' "$DOM" | grep -qi '<body'; then
        printf 'ok %d has body element: %s\n' $((COUNT * 3 + 2)) "$PAGE"
    else
        printf 'not ok %d has body element: %s\n' $((COUNT * 3 + 2)) "$PAGE"
    fi
done < "$TMP"

TOTAL_CHECKS=$((TOTAL * 3))
printf 'ok %d %d checks total\n' $((TOTAL_CHECKS + 2)) "$TOTAL_CHECKS"
exit 0
