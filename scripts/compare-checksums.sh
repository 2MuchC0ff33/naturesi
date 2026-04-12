#!/bin/sh
# scripts/compare-checksums.sh — Compare local files against mirrored FTP download.
# Files present on both sides are checked; differing ones are reported.
# Usage: scripts/compare-checksums.sh [in-both-list] [local-mirror-dir]
# Output: DIFF lines for files that differ, SAME lines for identical files.

IN_BOTH="${1:-/tmp/in-both.txt}"
MIRROR="${2:-/tmp/ftp-test}"

SAME=0
DIFF=0
MISSING_LOCAL=0
MISSING_MIRROR=0

while IFS= read -r FILE; do
    [ -z "$FILE" ] && continue

    LOCAL="$FILE"
    REMOTE="$MIRROR/$FILE"

    if [ ! -f "$LOCAL" ]; then
        printf 'MISSING_LOCAL: %s\n' "$FILE"
        MISSING_LOCAL=$((MISSING_LOCAL + 1))
        continue
    fi

    if [ ! -f "$REMOTE" ]; then
        printf 'MISSING_REMOTE: %s\n' "$FILE"
        MISSING_MIRROR=$((MISSING_MIRROR + 1))
        continue
    fi

    LOCAL_CKSUM=$(cksum "$LOCAL" | awk '{print $1}')
    REMOTE_CKSUM=$(cksum "$REMOTE" | awk '{print $1}')

    if [ "$LOCAL_CKSUM" = "$REMOTE_CKSUM" ]; then
        SAME=$((SAME + 1))
    else
        printf 'DIFF: %s\n' "$FILE"
        DIFF=$((DIFF + 1))
    fi
done < "$IN_BOTH"

printf '\n=== Checksum Summary ===\n'
printf 'Same:          %d\n' "$SAME"
printf 'Different:     %d\n' "$DIFF"
printf 'Missing local: %d\n' "$MISSING_LOCAL"
printf 'Missing mirror:%d\n' "$MISSING_MIRROR"
