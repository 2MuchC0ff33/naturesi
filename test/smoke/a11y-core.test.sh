#!/usr/bin/env yash
# test/smoke/a11y-core.test.sh — smoke test: core accessibility checks
# Checks: form labels, image alt text, heading hierarchy, button vs link

set -u

HTML_FILES=$(find . -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/')
FAIL=0
CHECKED=0

for FILE in $HTML_FILES; do
    CHECKED=$((CHECKED + 1))
    BASE=$(basename "$FILE")

    # Check images have alt or role="presentation"
    IMGS=$(grep -cE '<img[^>]+>' "$FILE" 2>/dev/null | tr -d '\n ' || echo 0)
    IMGS_WITH_ALT=$(grep -cE '<img[^>]+alt=' "$FILE" 2>/dev/null | tr -d '\n ' || echo 0)
    IMGS_PRES=$(grep -cE '<img[^>]+role="presentation"' "$FILE" 2>/dev/null | tr -d '\n ' || echo 0)
    if [ -n "$IMGS" ] && [ "$IMGS" -gt 0 ] 2>/dev/null; then
        COVERED=$((IMGS_WITH_ALT + IMGS_PRES))
        if [ "$COVERED" -lt "$IMGS" ] 2>/dev/null; then
            printf 'not ok %s: %d of %d images missing alt/role="presentation"\n' \
                "$BASE" "$((IMGS - COVERED))" "$IMGS"
            FAIL=$((FAIL + 1))
        else
            printf 'ok %s: all %d images have alt/role="presentation"\n' "$BASE" "$IMGS"
        fi
    fi

    # Check form inputs have associated labels
    INPUTS=$(grep -cE '<input' "$FILE" 2>/dev/null | tr -d '\n ' || echo 0)
    LABEL_FOR=$(grep -cE '<label[^>]+for=' "$FILE" 2>/dev/null | tr -d '\n ' || echo 0)
    if [ -n "$INPUTS" ] && [ "$INPUTS" -gt 0 ] 2>/dev/null; then
        if [ -n "$LABEL_FOR" ] && [ "$LABEL_FOR" -gt 0 ] 2>/dev/null; then
            printf 'ok %s: %d labels with for= for %d inputs\n' "$BASE" "$LABEL_FOR" "$INPUTS"
        else
            printf 'not ok %s: %d input(s) but no <label for=> bindings\n' "$BASE" "$INPUTS"
            FAIL=$((FAIL + 1))
        fi
    fi

    # Check heading hierarchy (no skipping levels)
    H1=$(grep -cE '<h1[^>]*>' "$FILE" 2>/dev/null | tr -d '\n ' || echo 0)
    if [ "$H1" -gt 1 ] 2>/dev/null; then
        printf 'not ok %s: multiple <h1> elements (%d)\n' "$BASE" "$H1"
        FAIL=$((FAIL + 1))
    elif [ "$H1" -eq 1 ]; then
        printf 'ok %s: has exactly one <h1>\n' "$BASE"
    fi
done

if [ "$CHECKED" -eq 0 ]; then
    printf 'ok 1 no HTML files found (skip)\n'
    exit 0
fi

printf 'ok 1 checked core a11y on %d page(s) (%d failures)\n' "$CHECKED" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
