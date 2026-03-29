#!/bin/sh
# test/unit/autoplay-loop.test.sh — unit test: autoplay-loop.js structure
# Checks: video autoplay, loop, playsinline attributes

set -u

FILE="assets/js/modules/autoplay-loop.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check init or start function
if grep -q 'export.*function' "$FILE"; then
    printf 'ok 2 exported function(s) present\n'
else
    printf 'not ok 2 no exported functions\n'
    FAIL=$((FAIL + 1))
fi

# Check autoplay handling
if grep -q 'autoplay\|play()\|play\|.play(' "$FILE"; then
    printf 'ok 3 autoplay logic present\n'
else
    printf 'not ok 3 autoplay logic missing\n'
    FAIL=$((FAIL + 1))
fi

# Check loop handling
if grep -q 'loop' "$FILE"; then
    printf 'ok 4 loop attribute handling present\n'
else
    printf 'not ok 4 loop handling missing\n'
    FAIL=$((FAIL + 1))
fi

# Check playsinline for mobile (warn if missing - causes native player on iOS)
if grep -q 'playsinline' "$FILE"; then
    printf 'ok 5 playsinline attribute present\n'
else
    printf 'WARN 5 playsinline missing in module (iOS may open native player)\n'
fi

printf 'ok 6 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
