#!/usr/bin/env yash
# test/smoke/categories.test.sh — smoke test: categories consistency
# Checks: categories.json is valid JSON and has expected structure

JSON="assets/js/data/categories.json"

if [ ! -f "$JSON" ]; then
    printf 'not ok 1 categories.json not found\n'
    exit 1
fi
printf 'ok 1 categories.json exists\n'

# Validate JSON parse
if jq . "$JSON" >/dev/null 2>&1; then
    printf 'ok 2 categories.json is valid JSON\n'
else
    printf 'not ok 2 categories.json is valid JSON\n'
    jq . "$JSON" 2>&1 | head -3
    exit 1
fi

# Check has "categories" array
HAS_ARRAY=$(jq -e '.categories | type == "array"' "$JSON" 2>/dev/null && echo yes || echo no)
if [ "$HAS_ARRAY" = "yes" ]; then
    COUNT=$(jq '.categories | length' "$JSON" 2>/dev/null)
    printf 'ok 3 categories is an array with %s entries\n' "$COUNT"
else
    printf 'not ok 3 categories is an array\n'
fi

# Check each category has required fields
INDEX=4
jq -r '.categories[] | @json' "$JSON" 2>/dev/null | while IFS= read -r cat; do
    ID=$(printf '%s' "$cat" | jq -r '.slug // empty' 2>/dev/null || true)
    LABEL=$(printf '%s' "$cat" | jq -r '.label // empty' 2>/dev/null || true)
    HREF=$(printf '%s' "$cat" | jq -r '.href // empty' 2>/dev/null || true)
    if [ -n "$ID" ] && [ -n "$LABEL" ] && [ -n "$HREF" ]; then
        printf 'ok %d category slug=%s has label and href\n' "$INDEX" "$ID"
    else
        printf 'not ok %d category missing fields: id=%s label=%s href=%s\n' "$INDEX" "$ID" "$LABEL" "$HREF"
    fi
    INDEX=$((INDEX + 1))
done

exit 0
