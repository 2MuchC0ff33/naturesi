#!/usr/bin/env yash
# test/smoke/links.test.sh — smoke test: all internal links resolve to existing files

set -u

HTML_FILES=$(find . -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/dist/')
TOTAL=0
FAIL=0

for FILE in $HTML_FILES; do
    DIR=$(dirname "$FILE")
    # Extract href values that point to local files (not external, not anchors)
    LINKS=$(grep -oE 'href="[^"#]*"' "$FILE" 2>/dev/null \
        | sed 's/href="//;s/"$//' \
        | grep -vE '^(https?://|mailto:|tel:|#|//)' \
        || true)
    [ -z "$LINKS" ] && continue
    TOTAL=$((TOTAL + $(printf '%s\n' "$LINKS" | wc -l | tr -d ' ')))

    for LINK in $LINKS; do
        if [ -z "$LINK" ] || [ "$LINK" = "/" ]; then
            continue
        fi
        # Skip favicon/safari pinned tab references
        if printf '%s' "$LINK" | grep -qE 'safari-pinned-tab|favicon'; then
            continue
        fi
        # Resolve relative links
        if printf '%s' "$LINK" | grep -qE '^/'; then
            TARGET="${LINK#.}"       # strip leading dot if any
            TARGET="${TARGET#/}"      # strip leading / to make relative to repo root
        else
            TARGET="$DIR/$LINK"
            while printf '%s' "$TARGET" | grep -qE '/[^/]*/\.\./'; do
                TARGET=$(printf '%s' "$TARGET" | sed 's|/[^/]*/\.\./|/|')
            done
            TARGET="${TARGET#./}"
        fi
        if [ ! -f "$TARGET" ] && [ ! -d "$TARGET" ]; then
            printf 'not ok broken link: %s -> %s (in %s)\n' "$FILE" "$LINK" "$TARGET"
            FAIL=$((FAIL + 1))
        fi
    done
done

if [ "$TOTAL" -eq 0 ]; then
    printf 'ok 1 no internal links found (skip)\n'
    exit 0
fi

printf 'ok 1 checked %d internal link(s) (%d failures)\n' "$TOTAL" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
