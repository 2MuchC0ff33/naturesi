h47511
s 00056/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/bin/sh
# scripts/test-all.sh — Run all tests under test/ directory
# Tests must be standalone shell scripts with .test.sh suffix

set -u

TEST_DIR="${1:-test}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ERRORS=0
PASS=0
FAIL=0
SKIP=0

# Find all test scripts
TESTS=$(find "$TEST_DIR" -name '*.test.sh' -type f 2>/dev/null | sort)

# Filter by TEST_PATTERN env var (e.g. TEST_PATTERN="cart" ./test-all.sh)
if [ -n "${TEST_PATTERN:-}" ]; then
    TESTS=$(printf '%s\n' "$TESTS" | grep "$TEST_PATTERN")
fi

if [ -z "$TESTS" ]; then
    printf 'No tests found under %s\n' "$TEST_DIR"
    exit 0
fi

TOTAL=$(printf '%s\n' "$TESTS" | wc -l)
printf 'Running %d test(s) under %s...\n\n' "$TOTAL" "$TEST_DIR"

for TEST in $TESTS; do
    TEST_NAME="${TEST#$TEST_DIR/}"
    printf '== %s ==\n' "$TEST_NAME"
    START=$(date +%s)
    if "$SCRIPT_DIR/test-one.sh" "$TEST" >/dev/null 2>&1; then
        END=$(date +%s)
        ELAPSED=$((END - START))
        printf 'PASS: %s (%.1fs)\n' "$TEST_NAME" "$ELAPSED"
        PASS=$((PASS + 1))
    else
        END=$(date +%s)
        ELAPSED=$((END - START))
        printf 'FAIL: %s (%.1fs)\n' "$TEST_NAME" "$ELAPSED" >&2
        # Capture output for debugging
        "$SCRIPT_DIR/test-one.sh" "$TEST" 2>&1 | tail -10 >&2
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
E 1
