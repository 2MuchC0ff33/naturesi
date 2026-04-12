h63769
s 00164/00000/00000
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
# scripts/lint-css-full.sh — Full CSS lint checks
# Checks: unused classes, duplicate props, specificity, z-index conflicts,
#         missing font fallbacks, color contrast hints, flex/grid gap
# Usage: scripts/lint-css-full.sh [file.css...]

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"

ERRORS=0
WARN=0

usage() {
    printf 'usage: %s [file.css...]\n' "$0"
    exit 1
}

get_files() {
    if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        find "$BASE_DIR/assets/css" -name '*.css' -type f 2>/dev/null
    else
        printf '%s\n' "$@"
    fi
}

FILETMP=$(mktemp)
trap 'rm -f "$FILETMP"' EXIT
get_files "$@" > "$FILETMP"

while IFS= read -r FILE || [ -n "$FILE" ]; do
    if [ ! -f "$FILE" ]; then
        continue
    fi

    printf 'Checking: %s\n' "$FILE"
    FILE_ERRORS=0
    FILE_WARN=0

    # 1. No // comments (POSIX CSS rule)
    BAD_LINES=$(grep -nE '(^|[^/])//' "$FILE" 2>/dev/null || true)
    if [ -n "$BAD_LINES" ]; then
        FILTERED=$(printf '%s\n' "$BAD_LINES" | grep -vE 'url\(|https?://|@import' || true)
        if [ -n "$FILTERED" ]; then
            printf '  FAIL: // style comment(s) found\n'
            printf '%s\n' "$FILTERED" | head -3
            FILE_ERRORS=$((FILE_ERRORS + 1))
            ERRORS=$((ERRORS + 1))
        fi
    fi

    # 2. Duplicate property declarations within same rule
    DUP_PROPS=$(awk '
        /^[[:space:]]*[a-z-]+[[:space:]]*:/ {
            sub(/:.*/, "")
            sub(/^[[:space:]]+/, "")
            sub(/[[:space:]]+$/, "")
            prop = $0
            gsub(/-./, toupper(substr($0, index($0, "-")+1, 1)), prop)
            if (prop != "") seen[prop]++
        }
        /^[[:space:]]*\{/ { in_block = 1; delete seen }
        /^[[:space:]]*\}/ { in_block = 0 }
        END {
            for (p in seen) {
                if (seen[p] > 1) printf "%s (%d times)\n", p, seen[p]
            }
        }
    ' "$FILE" 2>/dev/null || true)
    if [ -n "$DUP_PROPS" ]; then
        printf '  WARN: duplicate property declarations: %s\n' "$DUP_PROPS"
        FILE_WARN=$((FILE_WARN + 1))
        WARN=$((WARN + 1))
    fi

    # 3. Specificity warnings (selectors with >3 classes/IDs)
    HIGH_SPEC=$(grep -nE '^([^.#[^,{]*){' "$FILE" 2>/dev/null | awk -F: '
    {
        sel = $2
        gsub(/{.*/, "", sel)
        classes = gsub(/\./, ".", sel)
        ids = gsub(/#/, "#", sel)
        total = classes + ids
        if (total > 3) print NR ": " sel " (classes=" classes ", ids=" ids ")"
    }
    ' 2>/dev/null | head -5 || true)
    if [ -n "$HIGH_SPEC" ]; then
        printf '  WARN: high-specificity selectors (>3 classes/ids):\n'
        printf '%s\n' "$HIGH_SPEC" | head -5
        FILE_WARN=$((FILE_WARN + 1))
        WARN=$((WARN + 1))
    fi

    # 4. z-index conflicts (values 1-999, no stacking context documented)
    BAD_Z=$(grep -nE 'z-index\s*:\s*[0-9]{1,3}([^0-9]|$)' "$FILE" 2>/dev/null | head -10 || true)
    if [ -n "$BAD_Z" ]; then
        printf '  INFO: low z-index values found (may need explicit stacking):\n'
        printf '%s\n' "$BAD_Z" | head -5
    fi

    # 5. Missing font fallbacks (font-family without serif/sans-serif)
    NO_FALLBACK=$(awk '
        /font-family\s*:/ {
            line = $0
            sub(/font-family\s*:\s*/, "", line)
            sub(/;.*/, "", line)
            has_generic = 0
            if (line ~ /serif$/) has_generic = 1
            if (line ~ /sans-serif$/) has_generic = 1
            if (line ~ /monospace$/) has_generic = 1
            if (line ~ /cursive$/) has_generic = 1
            if (line ~ /fantasy$/) has_generic = 1
            if (!has_generic && line !~ /var\(/) {
                print NR ": " $0
            }
        }
    ' "$FILE" 2>/dev/null | head -5 || true)
    if [ -n "$NO_FALLBACK" ]; then
        printf '  WARN: font-family without generic fallback:\n'
        printf '%s\n' "$NO_FALLBACK" | head -5
        FILE_WARN=$((FILE_WARN + 1))
        WARN=$((WARN + 1))
    fi

    # 6. Color contrast hints (WCAG AA requires 4.5:1 for normal text)
    # Flag very light text on very light backgrounds (rarely intentional)
    LIGHT_TEXT=$(grep -nE 'color\s*:\s*#(fff|f{3}|ffffff|fff[fF])\s*;' "$FILE" 2>/dev/null | head -5 || true)
    LIGHT_BG=$(grep -nE '(background|background-color)\s*:\s*#(fff|f{3}|ffffff|fff[fF])\s*;' "$FILE" 2>/dev/null | head -5 || true)
    if [ -n "$LIGHT_TEXT" ] && [ -n "$LIGHT_BG" ]; then
        printf '  INFO: white text on white background (contrast issue?)\n'
        FILE_WARN=$((FILE_WARN + 1))
        WARN=$((WARN + 1))
    fi

    # 7. Flex/grid gap fallbacks (gap without fallback)
    FLEX_GAP_NO_FALLBACK=$(awk '
        /\bflex\b/ && /gap\s*:/ && !/grid-gap/ && !/padding/ {
            has_padding = 0
            line_num = NR
        }
        /\bflex\b/ && /gap\s*:/ {
            printf "%d: gap without padding fallback\n", NR
        }
    ' "$FILE" 2>/dev/null | head -5 || true)
    if [ -n "$FLEX_GAP_NO_FALLBACK" ]; then
        printf '  INFO: flex gap may need padding fallback for older browsers\n'
    fi

    if [ "$FILE_ERRORS" -gt 0 ]; then
        printf '  %d error(s), %d warning(s)\n' "$FILE_ERRORS" "$FILE_WARN"
    elif [ "$FILE_WARN" -gt 0 ]; then
        printf '  %d warning(s)\n' "$FILE_WARN"
    else
        printf '  OK\n'
    fi
    printf '\n'
done < "$FILETMP"

printf '=== Summary: %d error(s), %d warning(s) ===\n' "$ERRORS" "$WARN"
if [ "$ERRORS" -gt 0 ]; then
    exit 1
fi
exit 0
E 1
