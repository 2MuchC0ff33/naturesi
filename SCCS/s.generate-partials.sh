h03745
s 00119/00000/00000
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
# scripts/generate-partials.sh — Pre-deploy: inject .txt partials into HTML at INCLUDE markers
# Usage: scripts/generate-partials.sh [--dry-run]
# Run from repo root: ./scripts/generate-partials.sh
# Adds <!-- INCLUDE name --> markers to HTML, replaces them with partials/name.txt content

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"
PARTIALS_DIR="$BASE_DIR/partials"
DRY_RUN=false

if [ "${1:-}" = "--dry-run" ] || [ "${1:-}" = "-n" ]; then
    DRY_RUN=true
fi

if [ ! -d "$PARTIALS_DIR" ]; then
    printf 'ERROR: partials/ directory not found at %s\n' "$PARTIALS_DIR" >&2
    exit 1
fi

HTMLTMP=$(mktemp)
MARKTMP=$(mktemp)
trap 'rm -f "$HTMLTMP" "$MARKTMP"' EXIT

ERRORS=0
PROCESSED=0

find "$BASE_DIR" -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/.git/' > "$HTMLTMP"

while IFS= read -r html_file || [ -n "$html_file" ]; do
    # Extract all INCLUDE markers from this file
    grep -oE '<!--[ ]*INCLUDE[ ]+[a-zA-Z0-9_-]+[ ]*-->' "$html_file" 2>/dev/null | \
        sed -n 's/<!--[ ]*INCLUDE[ ]\+\([a-zA-Z0-9_-]*\)[ ]*-->/\1/p' | \
        sort | uniq > "$MARKTMP"

    if [ ! -s "$MARKTMP" ]; then
        continue
    fi

    PROCESSED=$((PROCESSED + 1))
    printf 'Processing: %s\n' "$html_file"

    cp "$html_file" "${html_file}.bak"

    while IFS= read -r name || [ -n "$name" ]; do
        partial_file="$PARTIALS_DIR/${name}.txt"
        if [ ! -f "$partial_file" ]; then
            printf '  ERROR: partial not found: %s\n' "$partial_file" >&2
            ERRORS=$((ERRORS + 1))
            continue
        fi

        PARTIAL_LINES=$(wc -l < "$partial_file")
        if $DRY_RUN; then
            printf '  DRY: would replace INCLUDE %s with %s (%s lines)\n' \
                "$name" "$partial_file" "$PARTIAL_LINES"
        else
            # Use awk for multi-line replacement
            PARTIAL_LEN=$(awk -v partial="$partial_file" '
            BEGIN {
                lines = 0
            }
            {
                lines++
            }
            END {
                print lines
            }
            ' "$partial_file")
            awk -v marker="INCLUDE $name" -v partial="$partial_file" '
            BEGIN {
                while ((getline line < partial) > 0) {
                    partial_content = partial_content line "\n"
                }
                close(partial)
                sub(/\n$/, "", partial_content)
            }
            {
                if ($0 ~ "<!-- " marker " -->") {
                    print partial_content
                } else {
                    print $0
                }
            }
            ' "$html_file" > "${html_file}.new"

            if [ -s "${html_file}.new" ]; then
                mv "${html_file}.new" "$html_file"
                printf '  OK: replaced INCLUDE %s (%s lines)\n' "$name" "$PARTIAL_LEN"
            else
                rm -f "${html_file}.new"
                printf '  ERROR: failed to replace INCLUDE %s\n' "$name" >&2
                ERRORS=$((ERRORS + 1))
            fi
        fi
    done < "$MARKTMP"
done < "$HTMLTMP"

if $DRY_RUN; then
    printf '\nDRY RUN: %d file(s) would be processed, %d error(s)\n' "$PROCESSED" "$ERRORS"
else
    # Clean up .bak files if no errors
    if [ "$ERRORS" -eq 0 ]; then
        find "$BASE_DIR" -name '*.bak' -type f 2>/dev/null | while IFS= read -r f; do
            rm -f "$f"
        done
        printf '\nGenerated: %d file(s) processed, %d error(s)\n' "$PROCESSED" "$ERRORS"
    else
        printf '\nErrors encountered. Backup files (*.bak) preserved.\n'
        printf 'Processed: %d file(s), %d error(s)\n' "$PROCESSED" "$ERRORS"
    fi
fi

if [ "$ERRORS" -gt 0 ]; then
    exit 1
fi
exit 0
E 1
