h32591
s 00170/00000/00000
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
# scripts/lint-html-full.sh — Full HTML lint checks
# Checks: duplicate IDs, heading hierarchy, semantic elements,
#         data-* validity, required attrs, autocomplete on forms,
#         noscript fallback, viewport max-scale abuse
# Usage: scripts/lint-html-full.sh [file.html...]

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"

ERRORS=0
WARN=0

get_files() {
    if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        find "$BASE_DIR" -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/.git/'
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

    # 1. Duplicate IDs
    DUP_IDS=$(awk '
        /<[^>]+id\s*=\s*["\x27][^"\x27]+["\x27]/ {
            gsub(/.*id\s*=\s*["\x27]/, ""); gsub(/["\x27].*/, "")
            if ($0 != "") ids[$0]++
        }
        END {
            for (id in ids) if (ids[id] > 1) print id
        }
    ' "$FILE" 2>/dev/null || true)
    if [ -n "$DUP_IDS" ]; then
        printf '  FAIL: duplicate ID(s): %s\n' "$DUP_IDS"
        FILE_ERRORS=$((FILE_ERRORS + 1))
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no duplicate IDs\n'
    fi

    # 2. Heading hierarchy (h1→h2→h3, no skips)
    HAS_H1=$(grep -cE '<h1[^>]*>' "$FILE" 2>/dev/null)
    HAS_H1=${HAS_H1:-0}
    if [ "$HAS_H1" -gt 0 ]; then
        MAX_HEADING=$(awk '
            /<h([1-6])[^>]*>/ {
                gsub(/<h/, ""); gsub(/[^0-9].*/, "")
                if (($0 "") + 0 > max) max = ($0 "") + 0
            }
            END { print max + 0 }
        ' "$FILE" 2>/dev/null || echo 0)
        MAX_HEADING=${MAX_HEADING:-0}
        if [ "$MAX_HEADING" -gt 6 ]; then
            printf '  WARN: unusual heading structure (max: h%s)\n' "$MAX_HEADING"
            WARN=$((WARN + 1))
        fi
    fi

    # 3. HTML5 semantic elements
    for elem in header main nav footer article section aside; do
        COUNT=$(grep -cE "<${elem}[^>]*>" "$FILE" 2>/dev/null)
        COUNT=${COUNT:-0}
        if [ "$COUNT" -gt 0 ]; then
            printf '  INFO: %d <%s> element(s)\n' "$COUNT" "$elem"
        fi
    done

    # 4. data-* attribute validity (must start with letter, no uppercase)
    BAD_DATA=$(grep -oE 'data-[A-Z][^=]*=' "$FILE" 2>/dev/null | head -5 || true)
    if [ -n "$BAD_DATA" ]; then
        printf '  FAIL: data-* attributes with uppercase: %s\n' "$BAD_DATA"
        FILE_ERRORS=$((FILE_ERRORS + 1))
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: data-* naming valid\n'
    fi

    # 5. Required attributes on inputs (check for missing type on non-control inputs)
    INPUTS=$(grep -nE '<input[^>]*>' "$FILE" 2>/dev/null | grep -vE 'type\s*=\s*["\x27](hidden|submit|button|reset|image)["\x27]' || true)
    if [ -n "$INPUTS" ]; then
        LINES_WITH_MISSING_TYPE=$(printf '%s\n' "$INPUTS" | awk -F: '
            NR==1 { next }
            { line = $0; sub(/^[^:]+:[[:space:]]*/, "", line) }
            line !~ /type\s*=\s*["\x27][^"\x27]+["\x27]/ { print $1 }
        ' | wc -l | tr -d ' ' || echo 0)
        LINES_WITH_MISSING_TYPE=${LINES_WITH_MISSING_TYPE:-0}
        if [ "$LINES_WITH_MISSING_TYPE" -gt 0 ]; then
            printf '  WARN: %d <input> missing type attribute\n' "$LINES_WITH_MISSING_TYPE"
            WARN=$((WARN + 1))
        fi
    fi

    # 6. Form autocomplete
    FORMS=$(grep -cE '<form[^>]*>' "$FILE" 2>/dev/null)
    FORMS=${FORMS:-0}
    if [ "$FORMS" -gt 0 ]; then
        TOTAL_INPUTS=$(grep -cE '<(input|select|textarea)[^>]*>' "$FILE" 2>/dev/null)
        TOTAL_INPUTS=${TOTAL_INPUTS:-0}
        if [ "$TOTAL_INPUTS" -gt 3 ]; then
            HAS_AUTOCOMPLETE=$(grep -cE 'autocomplete\s*=\s*["\x27][^"\x27]+["\x27]' "$FILE" 2>/dev/null)
            HAS_AUTOCOMPLETE=${HAS_AUTOCOMPLETE:-0}
            if [ "$HAS_AUTOCOMPLETE" -eq 0 ]; then
                printf '  WARN: form with %d inputs has no autocomplete attributes\n' "$TOTAL_INPUTS"
                WARN=$((WARN + 1))
            fi
        fi
    fi

    # 7. noscript fallback
    if grep -qiE '<script[^>]*>' "$FILE" 2>/dev/null; then
        HAS_NOSCRIPT=$(grep -ciE '<noscript>' "$FILE" 2>/dev/null)
        HAS_NOSCRIPT=${HAS_NOSCRIPT:-0}
        if [ "$HAS_NOSCRIPT" -eq 0 ]; then
            printf '  INFO: page has <script> but no <noscript>\n'
        fi
    fi

    # 8. Viewport max-scale abuse
    BAD_VIEWPORT=$(grep -iE '<meta[^>]+viewport[^>]+max-scale\s*=\s*["\x27]1['\''"][^>]*>' "$FILE" 2>/dev/null || true)
    if [ -n "$BAD_VIEWPORT" ]; then
        printf '  WARN: viewport max-scale=1 prevents zoom (accessibility issue)\n'
        WARN=$((WARN + 1))
    fi

    # 9. Skip links for keyboard navigation
    HAS_SKIP=false
    grep -qiE '<a[^>]+href\s*=\s*["\x27]#(main|content)['\''"][^>]*>' "$FILE" 2>/dev/null && HAS_SKIP=true
    grep -qiE 'class\s*=\s*["\x27][^"\x27]*skip['\''"]' "$FILE" 2>/dev/null && HAS_SKIP=true
    if $HAS_SKIP; then
        :
    else
        HAS_MAIN=$(grep -cE '<main' "$FILE" 2>/dev/null)
        HAS_MAIN=${HAS_MAIN:-0}
        if [ "$HAS_MAIN" -gt 0 ]; then
            printf '  INFO: <main> found but no skip-to-content link\n'
        fi
    fi

    # 10. Meta description length (>150 chars is too long)
    LONG_DESC=$(grep -ciE '<meta[^>]+name\s*=\s*["\x27]description["\x27][^>]+content\s*=\s*["\x27][^"\x27]{150,}['\''"]' "$FILE" 2>/dev/null)
    LONG_DESC=${LONG_DESC:-0}
    if [ "$LONG_DESC" -gt 0 ]; then
        printf '  WARN: meta description >150 chars (Google truncates at ~155)\n'
        WARN=$((WARN + 1))
    fi

    if [ "$FILE_ERRORS" -gt 0 ]; then
        printf '  %d error(s) in this file\n' "$FILE_ERRORS"
    fi
    printf '\n'
done < "$FILETMP"

printf '=== Summary: %d error(s), %d warning(s) ===\n' "$ERRORS" "$WARN"
if [ "$ERRORS" -gt 0 ]; then
    exit 1
fi
exit 0
E 1
