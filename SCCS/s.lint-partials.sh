h36966
s 00073/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/bin/sh
# scripts/lint-partials.sh — Verify INCLUDE markers resolve, no broken includes
# Usage: scripts/lint-partials.sh

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"
PARTIALS_DIR="$BASE_DIR/partials"

ERRORS=0
WARN=0

if [ ! -d "$PARTIALS_DIR" ]; then
    printf 'INFO: partials/ directory does not exist (skipping)\n'
    exit 0
fi

printf '=== Checking INCLUDE markers ===\n\n'

# Find all HTML files
HTMLTMP=$(mktemp)
find "$BASE_DIR" -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/' > "$HTMLTMP"

# Extract all INCLUDE markers
MARKTMP=$(mktemp)
trap 'rm -f "$HTMLTMP" "$MARKTMP"' EXIT

grep -h 'INCLUDE' "$BASE_DIR"/pages/*.html 2>/dev/null | \
    sed -n 's/.*<!--[ ]*INCLUDE[ ]\+\([a-zA-Z0-9_-]*\)[ ]*-->.*/\1/p' | \
    sort | uniq > "$MARKTMP"

# Check partials exist
MARK_COUNT=0
while IFS= read -r name; do
    PARTIAL_FILE="$PARTIALS_DIR/${name}.txt"
    if [ ! -f "$PARTIAL_FILE" ]; then
        printf 'FAIL: partial not found: %s\n' "$PARTIAL_FILE"
        ERRORS=$((ERRORS + 1))
    else
        printf 'OK:   %s\n' "$name"
        MARK_COUNT=$((MARK_COUNT + 1))
    fi
done < "$MARKTMP"

# Check for orphaned partials (exist but not included)
ORPHANS=$(find "$PARTIALS_DIR" -name '*.txt' -type f 2>/dev/null | while IFS= read -r f; do
    NAME=$(basename -- "$f" .txt)
    if ! grep -rq "INCLUDE $NAME" "$BASE_DIR/pages/" 2>/dev/null; then
        printf '%s\n' "$NAME"
    fi
done || true)

if [ -n "$ORPHANS" ]; then
    printf '\nWARN: orphaned partials (exist but not included):\n'
    printf '%s\n' "$ORPHANS"
    WARN=$((WARN + 1))
fi

# Check partials are valid UTF-8
if find "$PARTIALS_DIR" -name '*.txt' -type f 2>/dev/null | head -1 | grep -q .; then
    BAD_UTF8=$(find "$PARTIALS_DIR" -name '*.txt' -type f -exec file -i {} \; 2>/dev/null | grep -v 'charset=utf-8' | head -5 || true)
    if [ -n "$BAD_UTF8" ]; then
        printf '\nWARN: non-UTF-8 partials:\n%s\n' "$BAD_UTF8"
        WARN=$((WARN + 1))
    fi
fi

printf '\n%d INCLUDE marker(s) checked, %d error(s), %d warning(s)\n' "$MARK_COUNT" "$ERRORS" "$WARN"
if [ "$ERRORS" -gt 0 ]; then
    exit 1
fi
exit 0
E 1
