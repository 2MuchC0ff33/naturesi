#!/bin/sh
# scripts/check-production-diff.sh — Compare production server with development branch
# Purpose: Detect drift between production and expected development state
# Usage: scripts/check-production-diff.sh [--verbose] [--output FILE]
# Requires: .env with FTP_HOST, FTP_USER, FTP_PASS

set -e

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"
ENV_FILE="$BASE_DIR/.env"

VERBOSE=false
OUTPUT_FILE=""

usage() {
    printf 'usage: %s [--verbose] [--output FILE]\n' "$0"
    printf '  --verbose  Show identical files as well\n'
    printf '  --output   Write report to FILE\n'
    exit 1
}

while [ $# -gt 0 ]; do
    case "$1" in
        --verbose) VERBOSE=true; shift ;;
        --output) OUTPUT_FILE="$2"; shift 2 ;;
        *) usage ;;
    esac
done

# Load .env
if [ -f "$ENV_FILE" ]; then
    while IFS='=' read -r KEY VALUE; do
        case "$KEY" in
            FTP_HOST) FTP_HOST="$VALUE" ;;
            FTP_USER) FTP_USER="$VALUE" ;;
            FTP_PASS) FTP_PASS="$VALUE" ;;
        esac
    done < "$ENV_FILE"
fi

# Validate required vars
if [ -z "${FTP_HOST:-}" ] || [ -z "${FTP_USER:-}" ] || [ -z "${FTP_PASS:-}" ]; then
    printf 'ERROR: FTP credentials not found in .env\n' >&2
    exit 1
fi

FTP_URL="ftp://${FTP_HOST}/"
CURL_OPTS="--ftp-ssl -k --silent --show-error -u ${FTP_USER}:${FTP_PASS}"

# Function to get remote checksum
get_remote_cksum() {
    FILE="$1"
    TMP=$(mktemp)
    if curl $CURL_OPTS -o "$TMP" "$FTP_URL$FILE" 2>/dev/null && [ -s "$TMP" ]; then
        cksum "$TMP" | awk '{print $1}'
        rm -f "$TMP"
    else
        rm -f "$TMP"
        printf 'MISSING'
    fi
}

# Function to get local checksum from development
get_local_cksum() {
    FILE="$1"
    if git show "development:$FILE" >/dev/null 2>&1; then
        git show "development:$FILE" | cksum | awk '{print $1}'
    else
        printf 'UNTRACKED'
    fi
}

# Output function
output() {
    if [ -n "$OUTPUT_FILE" ]; then
        printf '%s\n' "$1" >> "$OUTPUT_FILE"
    fi
    printf '%s\n' "$1"
}

# Header
output "=============================================="
output "PRODUCTION DIFF REPORT"
output "=============================================="
output "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
output "Server: $FTP_HOST"
output "Branch: development ($(git rev-parse --short development))"
output ""

IDENTICAL=0
DIFFERS=0
MISSING=0
UNTRACKED=0

# Check files in batches
output "Checking files..."
output ""

# Get list of tracked files
TRACKED_FILES=$(git ls-files)

IDENTICAL_FILES=""
DIFFER_FILES=""
MISSING_FILES=""

while IFS= read -r FILE; do
    # Skip .env and large binary files
    case "$FILE" in
        .env|*.psd|*.ai|*.zip|*.tar.gz|*.mp4|*.webm) continue ;;
    esac

    REMOTE_CKS=$(get_remote_cksum "$FILE")
    LOCAL_CKS=$(get_local_cksum "$FILE")

    if [ "$REMOTE_CKS" = "MISSING" ]; then
        output "MISSING: $FILE (not on server)"
        MISSING=$((MISSING + 1))
        MISSING_FILES="${MISSING_FILES}  - $FILE\n"
    elif [ "$LOCAL_CKS" = "UNTRACKED" ]; then
        if [ "$VERBOSE" = "true" ]; then
            output "UNTRACKED: $FILE (in repo only)"
        fi
        UNTRACKED=$((UNTRACKED + 1))
    elif [ "$REMOTE_CKS" != "$LOCAL_CKS" ]; then
        output "DIFFERS: $FILE"
        output "         Server: $REMOTE_CKS"
        output "         Dev:    $LOCAL_CKS"
        DIFFERS=$((DIFFERS + 1))
        DIFFER_FILES="${DIFFER_FILES}  - $FILE\n"
    else
        IDENTICAL=$((IDENTICAL + 1))
        if [ "$VERBOSE" = "true" ]; then
            output "IDENTICAL: $FILE"
        fi
    fi
done << EOF
$TRACKED_FILES
EOF

# Summary
output ""
output "=============================================="
output "SUMMARY"
output "=============================================="
output "Identical: $IDENTICAL"
output "Differs:   $DIFFERS"
output "Missing:   $MISSING"
output "Untracked: $UNTRACKED (not checked)"
output ""

if [ $DIFFERS -gt 0 ] || [ $MISSING -gt 0 ]; then
    output "⚠ WARNING: Production differs from development!"
    output ""
    output "Action required:"
    output "  1. Review the differing files above"
    output "  2. Determine if changes are intentional"
    output "  3. Deploy development to fix, or document changes"
    output ""
    output "To deploy development to production:"
    output "  cd $BASE_DIR"
    output "  git checkout development"
    output "  ./scripts/deploy-ftp.sh --dry-run"
    output "  ./scripts/deploy-ftp.sh"
fi

if [ $DIFFERS -eq 0 ] && [ $MISSING -eq 0 ]; then
    output "✓ Production matches development branch"
fi

output ""
output "Full report saved to: ${OUTPUT_FILE:-/dev/stdout}"
output ""

# Save detailed report if requested
if [ -n "$OUTPUT_FILE" ]; then
    output "Report saved to: $OUTPUT_FILE"
fi

exit 0
