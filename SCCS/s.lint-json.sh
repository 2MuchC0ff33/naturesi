h53667
s 00030/00000/00000
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
# scripts/lint-json.sh — POSIX JSON lint
# Runs jq . on all *.json files; reports errors

set -eu

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

ERRORS=0
PASS=0

find . -name '*.json' -type f 2>/dev/null | grep -v '/node_modules/' | sort > "$TMP"

while IFS= read -r f || [ -n "$f" ]; do
    if jq . "$f" >/dev/null 2>&1; then
        printf 'OK:   %s\n' "$f"
        PASS=$((PASS + 1))
    else
        printf 'FAIL: %s\n' "$f"
        jq . "$f" >/dev/null 2>&1
        ERRORS=$((ERRORS + 1))
    fi
done < "$TMP"

printf '\n%d file(s) passed, %d file(s) failed.\n' "$PASS" "$ERRORS"
if [ "$ERRORS" -gt 0 ]; then
    exit 1
fi
exit 0
E 1
