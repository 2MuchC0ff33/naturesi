#!/bin/sh
# scripts/test-headless.sh — Run all Chromium headless tests
# Prerequisites: apache running (scripts/serve.sh start)
# Requires: chromium in PATH (set CHROMIUM env var if not)
# Usage: scripts/test-headless.sh

set -eu

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"
TEST_DIR="$BASE_DIR/test/headless"

CHROMIUM="${CHROMIUM:-chromium}"
SITE_BASE="${SITE_BASE_URL:-http://localhost:8000}"
TIMEOUT="${TIMEOUT:-5000}"

# Check chromium is available
if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    CHROMIUM="/snap/bin/chromium"
fi

if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    printf 'WARN: chromium not found, skipping headless tests.\n'
    printf 'Set CHROMIUM env var or install chromium.\n'
    exit 0
fi

# Check site is reachable
CHECK_URL="${SITE_BASE}"
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$CHECK_URL" 2>/dev/null)
if ! printf '%s' "$HTTP_CODE" | grep -qE '^20[0-5]$'; then
    printf 'WARN: site not reachable at %s (status %s), skipping headless tests.\n' "$SITE_BASE" "$HTTP_CODE"
    printf 'Start with: scripts/serve.sh start\n'
    exit 0
fi

PASS=0
FAIL=0

TESTS=$(find "$TEST_DIR" -name '*.test.sh' -type f 2>/dev/null | sort)

if [ -z "$TESTS" ]; then
    printf 'No headless tests found under %s\n' "$TEST_DIR"
    exit 0
fi

TOTAL=$(printf '%s\n' "$TESTS" | wc -l | tr -d ' ')
printf 'Running %d headless test(s) with %s...\n\n' "$TOTAL" "$CHROMIUM"

for TEST in $TESTS; do
    TEST_NAME="${TEST#$TEST_DIR/}"
    printf '== %s ==\n' "$TEST_NAME"
    START=$(date +%s)
    if "$TEST" >/dev/null 2>&1; then
        END=$(date +%s)
        ELAPSED=$((END - START))
        printf 'PASS: %s (%.1fs)\n' "$TEST_NAME" "$ELAPSED"
        PASS=$((PASS + 1))
    else
        END=$(date +%s)
        ELAPSED=$((END - START))
        printf 'FAIL: %s (%.1fs)\n' "$TEST_NAME" "$ELAPSED" >&2
        "$TEST" 2>&1 | tail -10 >&2
        FAIL=$((FAIL + 1))
    fi
    printf '\n'
done

printf '=================================\n'
printf 'Results: %d passed, %d failed, %d total\n' "$PASS" "$FAIL" "$TOTAL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
