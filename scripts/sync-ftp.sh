#!/bin/sh
# scripts/sync-ftp.sh — Full CRUD sync of FTP production with staging branch.
# Pre-requisite: run scripts/ftp-sitemap.sh first to populate /tmp/ftp-test/
# Usage: scripts/sync-ftp.sh [--dry-run] [--step=create|update|delete]
#   --dry-run       Preview without making changes
#   --step=delete   Run delete step only
#   --step=update   Run update step only
#   --step=create   Run create/upload step only
#   (no flag = run all steps in order: delete → update → create)
#
# Requires: .env with FTP_HOST, FTP_USER, FTP_PASS
# Requires: /tmp/to-upload-final.txt, /tmp/diff-files.txt, /tmp/extra-on-ftp.txt
# Requires: /tmp/ftp-test mirror from scripts/ftp-sitemap.sh

set -e

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"
ENV_FILE="$BASE_DIR/.env"

DRY_RUN=false
STEP="all"

while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run) DRY_RUN=true ;;
        --step=*) STEP=$(printf '%s' "$1" | sed 's/--step=//') ;;
        *) echo "usage: $0 [--dry-run] [--step=create|update|delete]" >&2; exit 1 ;;
    esac
    shift
done

# Load .env
while IFS= read -r LINE; do
    case "$LINE" in
        FTP_HOST=*) FTP_HOST=$(printf '%s' "$LINE" | sed 's/^FTP_HOST=//; s/^[[:space:]]*//; s/[[:space:]]*$//') ;;
        FTP_USER=*) FTP_USER=$(printf '%s' "$LINE" | sed 's/^FTP_USER=//; s/^[[:space:]]*//; s/[[:space:]]*$//') ;;
        FTP_PASS=*) FTP_PASS=$(printf '%s' "$LINE" | sed 's/^FTP_PASS=//; s/^[[:space:]]*//; s/[[:space:]]*$//') ;;
    esac
done < "$ENV_FILE"

[ -z "${FTP_HOST:-}" ] && echo "ERROR: FTP credentials not found in .env" >&2 && exit 1

# Change to repo root so relative file paths resolve correctly
cd "$BASE_DIR"

FTP_URL="ftp://${FTP_HOST}/"
WGET_OPTS="--ftp-ssl -k --user=$FTP_USER --password=$FTP_PASS"
CURL_OPTS="--ftp-ssl -k --user "$FTP_USER:$FTP_PASS" --silent"
UPLOADED=0; SKIPPED=0; DELETED=0; FAILED=0

ftp_delete() {
    FILE="$1"
    if [ "$DRY_RUN" = "true" ]; then
        printf '[DRY] DELETE: %s\n' "$FILE"
    else
        if curl $CURL_OPTS -Q "DELE $FILE" "$FTP_URL" 2>/dev/null; then
            DELETED=$((DELETED + 1))
            printf 'DEL: %s\n' "$FILE"
        else
            FAILED=$((FAILED + 1))
            printf 'DEL-FAIL: %s\n' "$FILE" >&2
        fi
    fi
}

ftp_upload() {
    LOCAL="$1"
    REMOTE="$2"
    if [ "$DRY_RUN" = "true" ]; then
        printf '[DRY] UPLOAD: %s → %s\n' "$LOCAL" "$REMOTE"
    else
        if curl $CURL_OPTS -T "$LOCAL" "$FTP_URL$REMOTE" 2>/dev/null; then
            UPLOADED=$((UPLOADED + 1))
            printf 'OK:   %s\n' "$REMOTE"
        else
            FAILED=$((FAILED + 1))
            printf 'FAIL: %s\n' "$REMOTE" >&2
        fi
    fi
}

# ── STEP 1: DELETE ─────────────────────────────────────────────────────────
if [ "$STEP" = "all" ] || [ "$STEP" = "delete" ]; then
    echo ""
    echo "=== STEP 1: DELETE (33 files) ==="
    [ -f /tmp/extra-on-ftp.txt ] || { echo "ERROR: /tmp/extra-on-ftp.txt missing" >&2; exit 1; }
    while IFS= read -r FILE; do
        [ -z "$FILE" ] && continue
        ftp_delete "$FILE"
    done < /tmp/extra-on-ftp.txt
fi

# ── STEP 2: UPDATE ─────────────────────────────────────────────────────────
if [ "$STEP" = "all" ] || [ "$STEP" = "update" ]; then
    echo ""
    echo "=== STEP 2: UPDATE (43 files) ==="
    [ -f /tmp/diff-files.txt ] || { echo "ERROR: /tmp/diff-files.txt missing" >&2; exit 1; }
    while IFS= read -r FILE; do
        [ -z "$FILE" ] && continue
        ftp_upload "$FILE" "$FILE"
    done < /tmp/diff-files.txt
fi

# ── STEP 3: CREATE ─────────────────────────────────────────────────────────
if [ "$STEP" = "all" ] || [ "$STEP" = "create" ]; then
    echo ""
    echo "=== STEP 3: CREATE (14 files) ==="
    [ -f /tmp/to-upload-final.txt ] || { echo "ERROR: /tmp/to-upload-final.txt missing" >&2; exit 1; }
    while IFS= read -r FILE; do
        [ -z "$FILE" ] && continue
        ftp_upload "$FILE" "$FILE"
    done < /tmp/to-upload-final.txt
fi

echo ""
echo "=== SUMMARY ==="
echo "Uploaded: $UPLOADED"
echo "Deleted:  $DELETED"
echo "Skipped:  $SKIPPED"
echo "Failed:   $FAILED"

[ "$FAILED" -gt 0 ] && exit 1
exit 0
