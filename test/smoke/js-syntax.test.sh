#!/bin/sh
# test/smoke/js-syntax.test.sh — smoke test: all JS files have valid syntax

set -u

JS_FILES=$(find assets/js -name '*.js' -type f 2>/dev/null)
FAIL=0
CHECKED=0

for FILE in $JS_FILES; do
    CHECKED=$((CHECKED + 1))
    if command -v node >/dev/null 2>&1; then
        if node --check "$FILE" 2>/dev/null; then
            printf 'ok %s: valid JS syntax\n' "$FILE"
        else
            printf 'not ok %s: syntax error\n' "$FILE"
            FAIL=$((FAIL + 1))
        fi
    else
        # Fallback: basic brace/parens balance, strip // comments first
        CONTENT=$(sed 's|//.*||' "$FILE")
        BRACES=$(printf '%s' "$CONTENT" | tr -cd '{}' | wc -c | tr -d '\n ')
        PARENS=$(printf '%s' "$CONTENT" | tr -cd '()' | wc -c | tr -d '\n ')
        BRACKETS=$(printf '%s' "$CONTENT" | tr -cd '\[\]' | wc -c | tr -d '\n ')
        if [ "$((BRACES % 2))" -eq 0 ] && [ "$((PARENS % 2))" -eq 0 ] && [ "$((BRACKETS % 2))" -eq 0 ]; then
            printf 'ok %s: balanced (braces %s, parens %s, brackets %s)\n' \
                "$FILE" "$BRACES" "$PARENS" "$BRACKETS"
        else
            printf 'not ok %s: unbalanced (braces %s, parens %s, brackets %s)\n' \
                "$FILE" "$BRACES" "$PARENS" "$BRACKETS"
            FAIL=$((FAIL + 1))
        fi
    fi
done

if [ "$CHECKED" -eq 0 ]; then
    printf 'ok 1 no JS files found (skip)\n'
    exit 0
fi

printf 'ok 1 checked %d JS file(s) (%d failures)\n' "$CHECKED" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
