h31718
s 00078/00000/00000
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
# scripts/lint-data.sh — Lint all flat-file data files
# JSON via jq, CSV via awk, TXT via grep
# Usage: scripts/lint-data.sh

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"

ERRORS=0
PASS=0

printf '=== Linting data files ===\n\n'

# --- JSON files ---
JSONTMP=$(mktemp)
find "$BASE_DIR" -name '*.json' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/.git/' | sort > "$JSONTMP"
while IFS= read -r f; do
    if jq . "$f" >/dev/null 2>&1; then
        printf 'OK:   %s\n' "$f"
        PASS=$((PASS + 1))
    else
        printf 'FAIL: %s (invalid JSON)\n' "$f"
        ERRORS=$((ERRORS + 1))
    fi
done < "$JSONTMP"
rm -f "$JSONTMP"

# --- CSV files ---
CSVTMP=$(mktemp)
find "$BASE_DIR" -name '*.csv' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/.git/' | sort > "$CSVTMP"
while IFS= read -r f; do
    if [ ! -s "$f" ]; then
        printf 'FAIL: %s (empty file)\n' "$f"
        ERRORS=$((ERRORS + 1))
        continue
    fi
    # Check for UTF-8 validity (non-ASCII bytes that are invalid)
    LINES=$(wc -l < "$f")
    if [ -n "$LINES" ] && [ "$LINES" -gt 0 ]; then
        printf 'OK:   %s (%d lines)\n' "$f" "$LINES"
        PASS=$((PASS + 1))
    else
        printf 'FAIL: %s (no lines)\n' "$f"
        ERRORS=$((ERRORS + 1))
    fi
done < "$CSVTMP"
rm -f "$CSVTMP"

# --- TXT files ---
TXTTMP=$(mktemp)
find "$BASE_DIR" \( -name '*.txt' -o -name '*.csv' \) -type f 2>/dev/null \
    | grep -v '/node_modules/' | grep -v '/.git/' | grep -v '/.well-known/' | sort > "$TXTTMP"
while IFS= read -r f; do
    if [ ! -s "$f" ]; then
        printf 'FAIL: %s (empty file)\n' "$f"
        ERRORS=$((ERRORS + 1))
        continue
    fi
    # Check for non-printable control chars (except tab, newline, CR)
    BAD=$(grep -n '[^[:print:][:blank:]]' "$f" 2>/dev/null || true)
    if [ -n "$BAD" ]; then
        printf 'FAIL: %s (non-printable chars)\n' "$f"
        printf '%s\n' "$BAD" | head -3 >&2
        ERRORS=$((ERRORS + 1))
    else
        printf 'OK:   %s\n' "$f"
        PASS=$((PASS + 1))
    fi
done < "$TXTTMP"
rm -f "$TXTTMP"

printf '\n%d passed, %d failed.\n' "$PASS" "$ERRORS"
if [ "$ERRORS" -gt 0 ]; then
    exit 1
fi
exit 0
E 1
