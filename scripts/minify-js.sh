#!/bin/sh
# scripts/minify-js.sh — conservative POSIX JS minifier
# Whitespace-only collapse; preserves // and /* ... */ comments
# Usage: scripts/minify-js.sh <in.js> [out.js]

set -u

usage() {
    printf 'usage: %s <in.js> [out.js]\n' "$0"
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

# Conservative minify: collapse whitespace between tokens
# Note: this preserves all comments — review output before deploying
sed \
    -e 's/\r$//' \
    -e 's/^[[:space:]]\+//' \
    -e 's/[[:space:]]\+$//' \
    -e '/^[[:space:]]*$/d' \
    -e 's/[[:space:]]\+/ /g' \
    -e 's/ [[:space:]]*([ {]/\1/g' \
    -e 's/([ {]/&/g' \
    -e 's/ ([^s])/\1/g' \
    -e 's/( +/(/g' \
    -e 's/ +)/)/g' \
    -e 's/){/){/g' \
    -e 's/} )/})/g' \
    -e 's/; }/;}/g' \
    -e 's/} ;/};/g' \
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
printf '  NOTE: review output before deploying; comments are preserved\n'
exit 0
