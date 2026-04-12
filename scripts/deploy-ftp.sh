#!/bin/sh
# scripts/deploy-ftp.sh — Deploy site to production via FTPS
# Purpose: Upload changed files to ftp.naturesinfusions.com.au
# Usage: scripts/deploy-ftp.sh [--dry-run] [--diff]
#   --dry-run  Preview changes without uploading
#   --diff     Compare remote checksums before upload (default)
# Requires: .env with FTP_HOST, FTP_USER, FTP_PASS, FTP_REMOTE_PATH

set -e

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"
ENV_FILE="$BASE_DIR/.env"

usage() {
    printf 'usage: %s [--dry-run] [--diff]\n' "$0"
    printf '  --dry-run  Preview changes without uploading\n'
    printf '  --diff     Compare checksums before upload (default)\n'
    exit 1
}

DRY_RUN=false
DO_DIFF=false  # Disabled - needs debugging

while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run) DRY_RUN=true; DO_DIFF=false ;;
        --diff) DO_DIFF=true ;;
        *) usage ;;
    esac
    shift
done

# Load .env
if [ -f "$ENV_FILE" ]; then
    while IFS='=' read -r KEY VALUE; do
        case "$KEY" in
            FTP_HOST) FTP_HOST="$VALUE" ;;
            FTP_USER) FTP_USER="$VALUE" ;;
            FTP_PASS) FTP_PASS="$VALUE" ;;
            FTP_REMOTE_PATH) FTP_REMOTE_PATH="$VALUE" ;;
        esac
    done < "$ENV_FILE"
fi

# Validate required vars
if [ -z "${FTP_HOST:-}" ] || [ -z "${FTP_USER:-}" ] || [ -z "${FTP_PASS:-}" ]; then
    printf 'ERROR: FTP credentials not found in .env\n' >&2
    exit 1
fi

REMOTE_PATH=""  # Upload directly to FTP root (public_html)
FTP_URL="ftp://${FTP_HOST}/"
CURL_OPTS="--ftp-ssl -k --silent --show-error -u ${FTP_USER}:${FTP_PASS}"

cd "$BASE_DIR"

# Get list of changed files using git
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null | grep -v '^\.env$' | sort)

if [ -z "$CHANGED_FILES" ]; then
    CHANGED_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -v '^\.env$' | sort)
fi

if [ -z "$CHANGED_FILES" ]; then
    printf 'No changes to deploy.\n'
    exit 0
fi

TOTAL_FILES=$(printf '%s\n' "$CHANGED_FILES" | wc -l | tr -d ' ')
printf '=== Files to deploy: %s ===\n\n' "$TOTAL_FILES"

# Function: get remote file checksum
get_remote_cksum() {
    REMOTE_FILE="$1"
    TMP=$(mktemp)
    if curl "$CURL_OPTS" -o "$TMP" "$FTP_URL$REMOTE_FILE" 2>/dev/null && [ -s "$TMP" ]; then
        cksum "$TMP" | awk '{print $1}'
        rm -f "$TMP"
    else
        rm -f "$TMP"
        printf 'MISSING'
    fi
}

# Function: upload file
ftp_put() {
    LOCAL="$1"
    REMOTE="$2"
    
    if [ "$DRY_RUN" = "true" ]; then
        printf 'DRY: %s\n' "$REMOTE"
    else
        if curl "$CURL_OPTS" -T "$LOCAL" "$FTP_URL$REMOTE" 2>/dev/null; then
            printf 'OK:   %s\n' "$REMOTE"
        else
            printf 'FAIL: %s\n' "$REMOTE" >&2
        fi
    fi
}

UPLOADED=0
SKIPPED=0

printf 'Changed files:\n'
printf '%s\n' "$CHANGED_FILES" | awk '{print "  " $0}'

if [ "$DO_DIFF" = "true" ] && [ "$DRY_RUN" = "false" ]; then
    printf '\n--- Comparing checksums with remote ---\n'
    
    while IFS= read -r FILE; do
        [ -z "$FILE" ] && continue
        
        LOCAL_CKSUM=$(cksum "$FILE" | awk '{print $1}')
        REMOTE_CKSUM=$(get_remote_cksum "$REMOTE_PATH/$FILE")
        
        if [ "$LOCAL_CKSUM" = "$REMOTE_CKSUM" ]; then
            printf 'SAME: %s (cksum: %s)\n' "$FILE" "$LOCAL_CKSUM"
            SKIPPED=$((SKIPPED + 1))
        else
            printf 'DIFF: %s (local: %s, remote: %s)\n' "$FILE" "$LOCAL_CKSUM" "$REMOTE_CKSUM"
            ftp_put "$FILE" "$REMOTE_PATH/$FILE"
            UPLOADED=$((UPLOADED + 1))
        fi
    done << EOF
$CHANGED_FILES
EOF
else
    # Just upload all changed files
    while IFS= read -r FILE; do
        [ -z "$FILE" ] && continue
        ftp_put "$FILE" "$REMOTE_PATH/$FILE"
        UPLOADED=$((UPLOADED + 1))
    done << EOF
$CHANGED_FILES
EOF
fi

printf '\n=== Summary ===\n'
printf 'Would upload: %d\n' "$UPLOADED"
printf 'Skipped: %d\n' "$SKIPPED"
