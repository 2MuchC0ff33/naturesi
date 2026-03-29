#!/bin/sh
# test/smoke/css-files.test.sh — smoke test: no // comments in CSS
# Checks: all .css files use /* ... */ block comments only

CSS_FILES=$(mktemp)
find assets/css -name '*.css' -type f 2>/dev/null > "$CSS_FILES"
TOTAL=$(wc -l < "$CSS_FILES" | tr -d ' ')
COUNT=0
FAIL=0

if [ "$TOTAL" -eq 0 ] 2>/dev/null; then
    printf 'ok 1 no CSS files found (skip)\n'
    rm -f "$CSS_FILES"
    exit 0
fi

printf 'ok 1 found %d CSS file(s)\n' "$TOTAL"

while IFS= read -r FILE; do
    COUNT=$((COUNT + 1))
    # Look for // that is not in a URL or http://
    BAD=$(grep -nE '(^|[^/])//' "$FILE" 2>/dev/null | grep -vE 'url\(|https?://|@import' || true)
    if [ -n "$BAD" ]; then
        printf 'not ok %d // comment found in %s\n' $((COUNT + 1)) "$FILE"
        printf '  %s\n' "$BAD" | head -3
        FAIL=$((FAIL + 1))
    else
        printf 'ok %d no // comments in %s\n' $((COUNT + 1)) "$FILE"
    fi
done < "$CSS_FILES"

rm -f "$CSS_FILES"
printf 'ok %d %d files checked (%d failures)\n' $((TOTAL + 2)) "$TOTAL" "$FAIL"

exit 0
