#!/bin/sh
# test/smoke/css-vars.test.sh — smoke test: CSS custom properties defined before use
# Aggregates all definitions across all CSS files, then checks each file's usage

set -u

CSS_FILES=$(find assets/css -name '*.css' -type f 2>/dev/null)

# Step 1: Collect ALL variable definitions across all CSS files
ALL_DEFS=""
for FILE in $CSS_FILES; do
    DEFS=$(grep -oE -- '--[a-zA-Z0-9_-]+[[:space:]]*:' "$FILE" 2>/dev/null \
        | sed 's/:.*//;s/^--//' | sort | uniq)
    ALL_DEFS="$ALL_DEFS
$DEFS"
done
# Deduplicate
ALL_DEFS=$(printf '%s\n' "$ALL_DEFS" | grep -vE '^[[:space:]]*$' | sort | uniq)

# Step 2: Check each file's usage against the global definition set
FAIL=0
CHECKED=0

for FILE in $CSS_FILES; do
    CHECKED=$((CHECKED + 1))
    # Find all var(--name) usages in this file
    VARS=$(grep -oE -- 'var\(--[a-zA-Z0-9_-]+\)' "$FILE" 2>/dev/null \
        | sed "s/var(--//;s/)//" | sort | uniq)

    for VAR in $VARS; do
        if ! printf '%s\n' "$ALL_DEFS" | grep -qx "$VAR"; then
            printf 'not ok %s: var(--%s) used but not defined in any CSS file\n' "$FILE" "$VAR"
            FAIL=$((FAIL + 1))
        fi
    done
done

if [ "$CHECKED" -eq 0 ]; then
    printf 'ok 1 no CSS files found (skip)\n'
    exit 0
fi

printf 'ok 1 checked %d CSS file(s) for undefined variables (%d failures)\n' "$CHECKED" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
