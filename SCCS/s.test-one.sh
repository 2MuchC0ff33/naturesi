h62227
s 00040/00000/00000
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
# scripts/test-one.sh — Run a single test script
# Usage: scripts/test-one.sh test/smoke/example.test.sh

set -u

usage() {
    printf 'usage: %s <test-script.sh>\n' "$0"
    exit 1
}

if [ $# -eq 0 ]; then
    usage
fi

TEST="$1"

if [ ! -f "$TEST" ]; then
    printf 'ERROR: test file not found: %s\n' "$TEST" >&2
    exit 1
fi

if [ ! -x "$TEST" ]; then
    # Try making it executable
    chmod +x "$TEST" 2>/dev/null || true
fi

printf 'Running: %s\n' "$TEST"
START=$(date +%s)
if "$TEST"; then
    END=$(date +%s)
    ELAPSED=$((END - START))
    printf '\nPASS: %s (%.1fs)\n' "$TEST" "$ELAPSED"
    exit 0
else
    END=$(date +%s)
    ELAPSED=$((END - START))
    printf '\nFAIL: %s (%.1fs)\n' "$TEST" "$ELAPSED" >&2
    exit 1
fi
E 1
