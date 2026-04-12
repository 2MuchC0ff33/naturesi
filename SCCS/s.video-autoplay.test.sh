h21852
s 00069/00000/00000
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
# test/unit/video-autoplay.test.sh — TDD: Video autoplay attribute check
# Purpose: Verify <video> has autoplay and loop attributes
# TDD: Write this test FIRST, then fix the bug

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

INDEX_HTML="$BASE_DIR/index.html"
FAIL=0

if [ ! -f "$INDEX_HTML" ]; then
    printf 'ok 1 # skip index.html not found\n'
    exit 0
fi

printf 'TAP version 14\n'

# Test 1: Check for <video> element
if grep -q '<video' "$INDEX_HTML"; then
    printf 'ok 1 <video> element exists\n'
else
    printf 'not ok 1 <video> element exists\n'
    FAIL=$((FAIL + 1))
fi

# Test 2: Check for autoplay attribute
if awk '/<video/,/<\/video>/' "$INDEX_HTML" | grep -q 'autoplay'; then
    printf 'ok 2 video has autoplay attribute\n'
else
    printf 'not ok 2 video has autoplay attribute\n'
    FAIL=$((FAIL + 1))
fi

# Test 3: Check for loop attribute
if awk '/<video/,/<\/video>/' "$INDEX_HTML" | grep -q 'loop'; then
    printf 'ok 3 video has loop attribute\n'
else
    printf 'not ok 3 video has loop attribute\n'
    FAIL=$((FAIL + 1))
fi

# Test 4: Check muted attribute (required for autoplay in most browsers)
if awk '/<video/,/<\/video>/' "$INDEX_HTML" | grep -q 'muted'; then
    printf 'ok 4 video has muted attribute\n'
else
    printf 'not ok 4 video has muted attribute\n'
    FAIL=$((FAIL + 1))
fi

# Test 5: Check for poster attribute (handle multi-line video elements)
if awk '/<video/,/<\/video>/' "$INDEX_HTML" | grep -q 'poster='; then
    printf 'ok 5 video has poster attribute\n'
else
    printf 'not ok 5 video has poster attribute\n'
    FAIL=$((FAIL + 1))
fi

printf '\n1..5\n'

if [ "$FAIL" -gt 0 ]; then
    printf 'FAIL: %d test(s) failed\n' "$FAIL"
    exit 1
fi

printf 'PASS: All tests passed\n'
exit 0
E 1
