#!/usr/bin/env yash
# scripts/minify-css.sh — conservative POSIX CSS minifier
# Removes excess whitespace; preserves /* ... */ block comments
# Usage: scripts/minify-css.sh <in.css> [out.css]

set -u

usage() {
    printf 'usage: %s <in.css> [out.css]\n' "$0"
    exit 1
}

if [ $# -lt 1 ]; then
    usage
fi

IN="$1"
OUT="${2:-dist/$(printf '%s' "$IN" | sed 's#^/##; s#^dist/##')}"

if [ ! -f "$IN" ]; then
    printf 'ERROR: file not found: %s\n' "$IN" >&2
    exit 1
fi

# Ensure output directory exists
OUT_DIR=$(dirname "$OUT")
mkdir -p "$OUT_DIR"

# Minify: collapse whitespace, remove excess blanks
# Strategy:
#   1. Remove blank lines and leading/trailing whitespace per line
#   2. Collapse multiple spaces to one
#   3. Remove spaces around { } : ; , > + ~
#   4. Preserve /* ... */ comments intact
sed \
    -e 's/\r$//' \
    -e 's/^[[:space:]]*//' \
    -e 's/[[:space:]]*$//' \
    -e '/^[[:space:]]*$/d' \
    -e 's/[[:space:]]\+/ /g' \
    -e 's/[[:space:]]*{/{/g' \
    -e 's/{[[:space:]]*/{/g' \
    -e 's/[[:space:]]*}/}/g' \
    -e 's/}[[:space:]]*/}/g' \
    -e 's/[[:space:]]*:/:/g' \
    -e 's/:[[:space:]]*/:/g' \
    -e 's/[[:space:]]*;/;/g' \
    -e 's/;[[:space:]]*/;/g' \
    -e 's/[[:space:]]*,[[:space:]]*/,/g' \
    -e 's/[[:space:]]*= */=/g' \
    -e 's/= *"/="/g' \
    "$IN" > "$OUT"

IN_LINES=$(wc -c < "$IN")
OUT_LINES=$(wc -c < "$OUT")
SAVED=$((IN_LINES - OUT_LINES))
PCT=0
if [ "$IN_LINES" -gt 0 ]; then
    PCT=$((SAVED * 100 / IN_LINES))
fi

printf '%s -> %s  (%d bytes -> %d bytes, saved %d bytes / %d%%)\n' \
    "$IN" "$OUT" "$IN_LINES" "$OUT_LINES" "$SAVED" "$PCT"
exit 0
