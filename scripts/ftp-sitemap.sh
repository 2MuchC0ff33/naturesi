#!/bin/sh
# scripts/ftp-sitemap.sh — Recursively spider FTP site into a temp local mirror,
# then emit a sorted list of all downloaded files with their original FTP paths.
# Usage: scripts/ftp-sitemap.sh [output_file]
# Requires: .env with FTP_HOST, FTP_USER, FTP_PASS, FTP_REMOTE_PATH
# Requires: wget
# Output: one relative-path-per-line to stdout and [output_file]

set -e

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"
ENV_FILE="$BASE_DIR/.env"

OUTPUT="${1:-/tmp/ftp-sitemap.txt}"

# Load .env (POSIX-safe)
while IFS= read -r LINE; do
    case "$LINE" in
        FTP_HOST=*) FTP_HOST=$(printf '%s' "$LINE" | sed 's/^FTP_HOST=//; s/^[[:space:]]*//; s/[[:space:]]*$//') ;;
        FTP_USER=*) FTP_USER=$(printf '%s' "$LINE" | sed 's/^FTP_USER=//; s/^[[:space:]]*//; s/[[:space:]]*$//') ;;
        FTP_PASS=*) FTP_PASS=$(printf '%s' "$LINE" | sed 's/^FTP_PASS=//; s/^[[:space:]]*//; s/[[:space:]]*$//') ;;
        FTP_REMOTE_PATH=*) FTP_REMOTE_PATH=$(printf '%s' "$LINE" | sed 's/^FTP_REMOTE_PATH=//; s/^[[:space:]]*//; s/[[:space:]]*$//') ;;
    esac
done < "$ENV_FILE"

[ -z "${FTP_HOST:-}" ] && echo "ERROR: FTP_HOST not set" >&2 && exit 1

FTP_URL="ftp://${FTP_USER}:${FTP_PASS}@${FTP_HOST}/"

# Temp dirs
TMP_MIRROR=$(mktemp -d)
TMP_CLEAN=$(mktemp)

trap 'rm -rf "$TMP_MIRROR" "$TMP_CLEAN"' EXIT

printf 'Spidering FTP site into %s ...\n' "$TMP_MIRROR" >&2
printf '  URL: %s\n' "$FTP_URL" >&2

wget --no-parent --recursive --no-host-directories --no-directories \
     --cut-dirs=0 \
     --reject "index.html*" \
     --accept "*" \
     --directory-prefix="$TMP_MIRROR" \
     --user="$FTP_USER" \
     --password="$FTP_PASS" \
     "$FTP_URL" 2>&1 | grep -E '^--' > "$TMP_CLEAN"

# Now build path list
printf 'Building path list ...\n' >&2
cd "$TMP_MIRROR"

find . -type f | sed 's|^\./||' | sort > "$OUTPUT"

COUNT=$(wc -l < "$OUTPUT" | tr -d ' ')
printf 'Total files: %s\n' "$COUNT" >&2
printf 'Output: %s\n' "$OUTPUT" >&2

# Show last 20
printf '\nLast 20 files:\n' >&2
tail -20 "$OUTPUT" >&2
