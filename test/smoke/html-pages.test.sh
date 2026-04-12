#!/bin/sh
# test/smoke/html-pages.test.sh — smoke test: HTML page conventions
# Checks: all HTML pages have DOCTYPE, lang="en-AU", charset, viewport

HTML_FILES=$(mktemp)
find . -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '\.inc\.html$' | grep -v 'yandex_' | grep -v 'google-site-verification' > "$HTML_FILES"
TOTAL=$(wc -l < "$HTML_FILES" | tr -d ' ')
COUNT=0
PASS=0
FAIL=0

if [ "$TOTAL" -eq 0 ] 2>/dev/null; then
    printf 'ok 1 no HTML files found (skip)\n'
    rm -f "$HTML_FILES"
    exit 0
fi

printf 'ok 1 found %d HTML file(s)\n' "$TOTAL"

while IFS= read -r FILE; do
    COUNT=$((COUNT + 1))
    # DOCTYPE on line 1
    FIRST=$(sed 1q "$FILE")
    if printf '%s' "$FIRST" | grep -qiE '^<!doctype html>'; then
        printf 'ok %d DOCTYPE in %s\n' $((COUNT * 4)) "$FILE"
    else
        printf 'not ok %d DOCTYPE in %s\n' $((COUNT * 4)) "$FILE"
        FAIL=$((FAIL + 1))
    fi

    # lang="en-AU"
    if grep -qiE '<html[^>]*lang="en-AU"' "$FILE" 2>/dev/null; then
        printf 'ok %d lang="en-AU" in %s\n' $((COUNT * 4 + 1)) "$FILE"
    else
        printf 'not ok %d lang="en-AU" in %s\n' $((COUNT * 4 + 1)) "$FILE"
        FAIL=$((FAIL + 1))
    fi

    # charset
    if grep -qiE '<meta[^>]+charset' "$FILE" 2>/dev/null; then
        printf 'ok %d charset in %s\n' $((COUNT * 4 + 2)) "$FILE"
    else
        printf 'not ok %d charset in %s\n' $((COUNT * 4 + 2)) "$FILE"
        FAIL=$((FAIL + 1))
    fi

    # viewport
    if grep -qiE '<meta[^>]+viewport' "$FILE" 2>/dev/null; then
        printf 'ok %d viewport in %s\n' $((COUNT * 4 + 3)) "$FILE"
    else
        printf 'not ok %d viewport in %s\n' $((COUNT * 4 + 3)) "$FILE"
        FAIL=$((FAIL + 1))
    fi
done < "$HTML_FILES"

rm -f "$HTML_FILES"
TOTAL_CHECKS=$((TOTAL * 4))
printf 'ok %d %d checks total (%d failures)\n' $((TOTAL_CHECKS + 2)) "$TOTAL_CHECKS" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
