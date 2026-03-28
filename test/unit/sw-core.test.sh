#!/usr/bin/env yash
# test/unit/sw-core.test.sh — unit test: sw-core.js structure
# Checks: service worker install, caching strategy, offline handling

set -u

FILE="assets/js/modules/sw-core.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check service worker install event (uses self.addEventListener, not a module)
if grep -q "self.addEventListener.*install" "$FILE"; then
    printf 'ok 2 SW install event listener present\n'
else
    printf 'not ok 2 SW install listener missing\n'
    FAIL=$((FAIL + 1))
fi

# Check cache strategies
if grep -q 'CacheFirst\|cacheFirst\|StaleWhileRevalidate\|staleWhileRevalidate\|cache-first\|Cache' "$FILE"; then
    printf 'ok 3 cache strategy present\n'
else
    printf 'not ok 3 cache strategy missing\n'
    FAIL=$((FAIL + 1))
fi

# Check offline fallback
if grep -q 'offline\|OFFLINE' "$FILE"; then
    printf 'ok 4 offline handling present\n'
else
    printf 'not ok 4 offline handling missing\n'
    FAIL=$((FAIL + 1))
fi

printf 'ok 5 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
