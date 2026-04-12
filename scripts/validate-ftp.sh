#!/bin/sh
# scripts/validate-ftp.sh — Validate FTP content against local
# Purpose: Compare FTP server files with local main branch
# Usage: scripts/validate-ftp.sh [--fix]
# Requires: .env with FTP_HOST, FTP_USER, FTP_PASS, FTP_REMOTE_PATH
# Exit: 0 = match, 1 = mismatch, 2 = FTP error
# WARNING: This script only lists and validates files at the top level of the specified FTP directory (REMOTE_PATH) using curl/MLSD commands.
# It does NOT scan recursively. Files and folders inside subdirectories on the server will NOT be seen or compared.
# For full recursive FTP validation, an external tool (like lftp) must be integrated. This script is intentionally shallow for portability and minimum dependencies.

set -e

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"
ENV_FILE="$BASE_DIR/.env"

usage() {
    printf 'usage: %s [--fix]\n' "$0"
    printf '  --fix  Sync missing files to FTP\n'
    exit 1
}

FIX_MODE=false
if [ $# -gt 0 ]; then
    if [ "$1" = "--fix" ]; then
        FIX_MODE=true
    else
        usage
    fi
fi

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
    printf 'Required: FTP_HOST, FTP_USER, FTP_PASS\n' >&2
    exit 2
fi

REMOTE_PATH="${FTP_REMOTE_PATH:-/public_html}"

# FTP base URL
FTP_URL="ftps://${FTP_USER}:${FTP_PASS}@${FTP_HOST}/"
CURL_OPTS="--ftp-ssl-control -k --silent --show-error"

# Counters
MATCH=0
MISSING_LOCAL=0
MISSING_REMOTE=0
CONTENT_DIFF=0
ERRORS=0

# Temp files
LOCAL_LIST=$(mktemp)
REMOTE_LIST=$(mktemp)
trap 'rm -f "$LOCAL_LIST" "$REMOTE_LIST"' EXIT

printf '=== FTP Validation ===\n\n'

# Get local file list from git main
cd "$BASE_DIR"
git ls-tree -r --name-only main 2>/dev/null | grep -v '/$' | sort > "$LOCAL_LIST" || {
    # Fallback to find if git fails
    find . -type f -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.json' -o -name '.htaccess' | \
        sed 's|^\./||' | grep -v '^node_modules/' | sort > "$LOCAL_LIST"
}

# Get remote file list via FTP MLSD
printf 'Fetching remote file list...\n'
curl "$CURL_OPTS" --quote "MLSD $REMOTE_PATH" "$FTP_URL" 2>/dev/null | \
    grep -E '^type=file' | \
    awk '{for(i=1;i<=NF;i++) if($i ~ /^ptly=/) print substr($i,6)}' | \
    sed "s|^$REMOTE_PATH/||" | \
    sort > "$REMOTE_LIST" || {
    printf 'ERROR: Could not connect to FTP server\n' >&2
    exit 2
}

LOCAL_COUNT=$(wc -l < "$LOCAL_LIST" | tr -d ' ')
REMOTE_COUNT=$(wc -l < "$REMOTE_LIST" | tr -d ' ')

printf 'Local files:  %d\n' "$LOCAL_COUNT"
printf 'Remote files: %d\n\n' "$REMOTE_COUNT"

# Compare file lists
printf '%s\n' '--- Checking file presence ---'

# Files in remote but not local (extra on FTP)
COMM_IGNORE=$(mktemp)
comm -23 "$REMOTE_LIST" "$LOCAL_LIST" > "$COMM_IGNORE"
while IFS= read -r FILE; do
    [ -z "$FILE" ] && continue
    printf 'EXTRA: %s exists on FTP but not in local\n' "$FILE" >&2
    MISSING_LOCAL=$((MISSING_LOCAL + 1))
done < "$COMM_IGNORE"
rm -f "$COMM_IGNORE"

# Files in local but not remote (missing on FTP)
COMM_MISSING=$(mktemp)
comm -13 "$REMOTE_LIST" "$LOCAL_LIST" > "$COMM_MISSING"
while IFS= read -r FILE; do
    [ -z "$FILE" ] && continue
    printf 'MISSING: %s missing on FTP\n' "$FILE" >&2
    MISSING_REMOTE=$((MISSING_REMOTE + 1))
done < "$COMM_MISSING"
rm -f "$COMM_MISSING"

# Files in both: compare content via cksum
printf '\n--- Checking content (cksum) ---\n'
COMM_BOTH=$(mktemp)
comm -12 "$LOCAL_LIST" "$REMOTE_LIST" > "$COMM_BOTH"

# Download each file and compare cksum
TMP_LOCAL=$(mktemp)
TMP_REMOTE=$(mktemp)

while IFS= read -r FILE; do
    [ -z "$FILE" ] && continue
    
    # Local cksum
    if [ -f "$FILE" ]; then
        LOCAL_CKSUM=$(cksum "$FILE" | awk '{print $1}')
    else
        LOCAL_CKSUM="N/A"
    fi
    
    # Remote cksum (download to temp)
    curl "$CURL_OPTS" -o "$TMP_REMOTE" "$FTP_URL$REMOTE_PATH/$FILE" 2>/dev/null
    if [ -s "$TMP_REMOTE" ]; then
        REMOTE_CKSUM=$(cksum "$TMP_REMOTE" | awk '{print $1}')
    else
        REMOTE_CKSUM="N/A"
    fi
    rm -f "$TMP_REMOTE"
    
    if [ "$LOCAL_CKSUM" = "$REMOTE_CKSUM" ]; then
        MATCH=$((MATCH + 1))
    else
        printf 'DIFF:   %s (local=%s remote=%s)\n' "$FILE" "$LOCAL_CKSUM" "$REMOTE_CKSUM" >&2
        CONTENT_DIFF=$((CONTENT_DIFF + 1))
    fi
done < "$COMM_BOTH"
rm -f "$COMM_BOTH" "$TMP_LOCAL"

# Fix mode: upload missing files
if [ "$FIX_MODE" = "true" ] && [ "$MISSING_REMOTE" -gt 0 ]; then
    printf '\n--- Fixing missing files ---\n'
    cd "$BASE_DIR"
    
    # Source deploy-ftp.sh helper
    COMM_MISSING=$(mktemp)
    comm -13 "$REMOTE_LIST" "$LOCAL_LIST" > "$COMM_MISSING"
    
    while IFS= read -r FILE; do
        [ -z "$FILE" ] && continue
        
        if curl "$CURL_OPTS" -T "$FILE" "$FTP_URL$REMOTE_PATH/$FILE" 2>/dev/null; then
            printf 'FIXED: %s\n' "$FILE"
        else
            printf 'ERROR: Failed to upload %s\n' "$FILE" >&2
            ERRORS=$((ERRORS + 1))
        fi
    done < "$COMM_MISSING"
    rm -f "$COMM_MISSING"
fi

# Summary
printf '\n=== Summary ===\n'
printf 'Match:        %d\n' "$MATCH"
printf 'Missing:      %d (on FTP but not local)\n' "$MISSING_LOCAL"
printf 'Not uploaded: %d (local but not on FTP)\n' "$MISSING_REMOTE"
printf 'Content diff: %d\n' "$CONTENT_DIFF"
printf 'Errors:       %d\n' "$ERRORS"

TOTAL_ISSUES=$((MISSING_LOCAL + MISSING_REMOTE + CONTENT_DIFF + ERRORS))

if [ "$TOTAL_ISSUES" -gt 0 ]; then
    printf '\nMISMATCH: FTP and local are out of sync.\n' >&2
    if [ "$FIX_MODE" = "true" ]; then
        printf 'Some files have been synced.\n'
    else
        printf 'Run with --fix to sync missing files.\n'
    fi
    exit 1
fi

printf '\nPASS: FTP matches local.\n'
exit 0
