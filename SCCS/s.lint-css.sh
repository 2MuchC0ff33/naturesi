h08188
s 00062/00000/00000
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
# scripts/lint-css.sh — POSIX CSS lint checks
# Checks: no // comments, block comments /* ... */ only

usage() {
    printf 'usage: %s [file.css...]\n' "$0"
    exit 1
}

if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    # Scan all .css files under assets/css/
    FINDTMP=$(mktemp)
    find assets/css -name '*.css' -type f 2>/dev/null > "$FINDTMP"
    while IFS= read -r f; do
        "$0" "$f"
    done < "$FINDTMP"
    rm -f "$FINDTMP"
    exit 0
fi

ERRORS=0
for FILE in "$@"; do
    if [ ! -f "$FILE" ]; then
        printf 'ERROR: file not found: %s\n' "$FILE" >&2
        ERRORS=$((ERRORS + 1))
        continue
    fi

    printf 'Checking: %s\n' "$FILE"

    # 1. No // single-line comments (ignore URLs and https://)
    # Use grep -n to get line numbers, then filter out lines with URLs
    BAD_LINES=$(grep -nE '(^|[^/])//' "$FILE" 2>/dev/null || true)
    if [ -n "$BAD_LINES" ]; then
        # Filter out lines that are URLs or import statements
        FILTERED=$(printf '%s\n' "$BAD_LINES" | grep -vE 'url\(|https?://|@import' || true)
        if [ -n "$FILTERED" ]; then
            printf '  FAIL: found // style comment(s) in CSS\n'
            printf '%s\n' "$FILTERED" | head -5
            ERRORS=$((ERRORS + 1))
        else
            printf '  OK: no // style comments\n'
        fi
    else
        printf '  OK: no // style comments\n'
    fi

    # 2. Basic stats
    TOTAL_LINES=$(wc -l < "$FILE" 2>/dev/null || echo 0)
    COMMENT_BLOCKS=$(grep -cE '/\*|\*/' "$FILE" 2>/dev/null || true)
    [ -z "$COMMENT_BLOCKS" ] && COMMENT_BLOCKS=0
    printf '  INFO: %d total lines, %d comment markers\n' "$TOTAL_LINES" "$COMMENT_BLOCKS"
    printf '\n'
done

if [ "$ERRORS" -gt 0 ] 2>/dev/null; then
    printf '%d error(s) found.\n' "$ERRORS" >&2
    exit 1
fi

printf 'All checks passed.\n'
exit 0
E 1
