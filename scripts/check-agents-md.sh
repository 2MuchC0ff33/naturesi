#!/bin/sh
# scripts/check-agents-md.sh — Validate AGENTS.md reflects actual scripts
# Purpose: Ensure documentation stays in sync with codebase
# Exit: 0 = in sync, 1 = outdated (BLOCKS commit if AGENTS_SYNC_STRICT=true)

set -e

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"
AGENTS_FILE="$BASE_DIR/AGENTS.md"

if [ ! -f "$AGENTS_FILE" ]; then
    printf 'ERROR: AGENTS.md not found at %s\n' "$AGENTS_FILE" >&2
    exit 1
fi

STRICT="${AGENTS_SYNC_STRICT:-false}"
PASS=0
FAIL=0
ISSUES=""

log_pass() {
    printf 'ok   %s\n' "$1"
    PASS=$((PASS + 1))
}

log_fail() {
    printf 'fail %s\n' "$1" >&2
    ISSUES="${ISSUES}
$1"
    FAIL=$((FAIL + 1))
}

printf '=== AGENTS.md Synchronization Check ===\n\n'

# Key scripts that MUST be documented (critical ones for this change)
KEY_SCRIPTS="
deploy-ftp.sh
validate-ftp.sh
check-agents-md.sh
validate-paypal.jq
ftp-list-parser.jq
"

# Check key new scripts are documented
printf 'Checking key scripts...\n'
for SCRIPT in deploy-ftp.sh validate-ftp.sh check-agents-md.sh; do
    if grep -qE "scripts/$SCRIPT" "$AGENTS_FILE" 2>/dev/null; then
        log_pass "documented: $SCRIPT"
    else
        log_fail "undocumented: $SCRIPT"
    fi
done

# Check JQ scripts
printf '\nChecking JQ scripts...\n'
for SCRIPT in validate-paypal.jq ftp-list-parser.jq; do
    if grep -qE "$SCRIPT" "$AGENTS_FILE" 2>/dev/null; then
        log_pass "documented: $SCRIPT"
    else
        log_fail "undocumented: $SCRIPT"
    fi
done

# Check Section 12 (FTP Deployment) exists
printf '\nChecking sections...\n'
if grep -q "FTP DEPLOYMENT" "$AGENTS_FILE" 2>/dev/null; then
    log_pass "Section 12: FTP DEPLOYMENT exists"
else
    log_fail "Section 12: FTP DEPLOYMENT missing"
fi

# Check Section 13 (AGENTS Sync) exists
if grep -q "AGENTS.MD SYNC" "$AGENTS_FILE" 2>/dev/null; then
    log_pass "Section 13: AGENTS.MD SYNC exists"
else
    log_fail "Section 13: AGENTS.MD SYNC missing"
fi

# Summary
printf '\n=== Summary ===\n'
printf 'Passed: %d\n' "$PASS"
printf 'Failed: %d\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    printf '\nUndocumented items:\n'
    printf '%s\n' "$ISSUES" | grep -v '^$' >&2
    
    if [ "$STRICT" = "true" ]; then
        printf '\nABORT: AGENTS.md is out of sync.\n' >&2
        printf 'Run: scripts/check-agents-md.sh to see mismatches.\n' >&2
        exit 1
    else
        printf '\nWARNING: AGENTS.md is out of sync (STRICT=false).\n'
        exit 1
    fi
fi

printf '\nPASS: AGENTS.md is in sync with key scripts.\n'
exit 0
