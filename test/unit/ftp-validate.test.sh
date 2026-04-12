#!/bin/sh
# test/unit/ftp-validate.test.sh — TDD: FTP validation
# Purpose: Test FTP connection and file structure
# Note: Skips if FTP credentials not configured

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$BASE_DIR/.env"

FAIL=0

printf 'TAP version 14\n'

# Load FTP credentials from .env
if [ -f "$ENV_FILE" ]; then
    while IFS='=' read -r KEY VALUE; do
        case "$KEY" in
            FTP_HOST) FTP_HOST="$VALUE" ;;
            FTP_USER) FTP_USER="$VALUE" ;;
            FTP_PASS) FTP_PASS="$VALUE" ;;
        esac
    done < "$ENV_FILE"
fi

# Test 1: FTP credentials exist
if [ -n "${FTP_HOST:-}" ] && [ -n "${FTP_USER:-}" ] && [ -n "${FTP_PASS:-}" ]; then
    printf 'ok 1 FTP credentials configured\n'
else
    printf 'ok 1 # skip FTP credentials not configured\n'
    printf '1..1\n'
    exit 0
fi

# Test 2: Can connect to FTP
if curl --ftp-ssl -k -u "${FTP_USER}:${FTP_PASS}" --silent --show-error \
    --connect-timeout 10 --max-time 30 \
    "ftp://${FTP_HOST}/" 2>/dev/null | grep -q .; then
    printf 'ok 2 FTP connection successful\n'
else
    printf 'not ok 2 FTP connection successful\n'
    FAIL=$((FAIL + 1))
fi

# Test 3: Can list root directory
if curl --ftp-ssl -k -u "${FTP_USER}:${FTP_PASS}" --silent --show-error \
    --connect-timeout 10 --max-time 30 \
    "ftp://${FTP_HOST}/" 2>/dev/null | grep -q .; then
    printf 'ok 3 FTP directory listing works\n'
else
    printf 'not ok 3 FTP directory listing works\n'
    FAIL=$((FAIL + 1))
fi

# Test 4: Remote path exists (FTP root IS the public directory)
if curl --ftp-ssl -k -u "${FTP_USER}:${FTP_PASS}" --silent --show-error \
    --connect-timeout 10 --max-time 30 \
    "ftp://${FTP_HOST}/" 2>/dev/null | grep -q 'index.html'; then
    printf 'ok 4 Remote path / (public root) accessible with index.html\n'
else
    printf 'not ok 4 Remote path / accessible\n'
    FAIL=$((FAIL + 1))
fi

printf '\n1..4\n'

if [ "$FAIL" -gt 0 ]; then
    printf 'FAIL: %d test(s) failed\n' "$FAIL" >&2
    exit 1
fi

printf 'PASS: All tests passed\n'
exit 0
