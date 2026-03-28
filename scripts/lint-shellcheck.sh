#!/bin/sh
# scripts/lint-shellcheck.sh — Run ShellCheck on all .sh files
# Uses shellcheck -s sh -S warning
# Excludes cosmetic info/style warnings: SC2034, SC2044, SC2041, SC2086,
#   SC2016, SC2126, SC2129, SC2015, SC2317, SC2295
# Run this before lint-shell.sh

set -u

TOTAL=0
ERRORS=0

for f in $(find . -name '*.sh' -type f 2>/dev/null | grep -v '/node_modules/'); do
    TOTAL=$((TOTAL + 1))
    result=$(shellcheck -s sh \
        --exclude=SC2034 \
        --exclude=SC2044 \
        --exclude=SC2041 \
        --exclude=SC2086 \
        --exclude=SC2016 \
        --exclude=SC2126 \
        --exclude=SC2129 \
        --exclude=SC2015 \
        --exclude=SC2317 \
        --exclude=SC2295 \
        "$f" 2>&1 || true)
    if [ -n "$result" ]; then
        printf '%s\n' "$result"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ "$ERRORS" -gt 0 ]; then
    printf 'lint-shellcheck: %d/%d file(s) with warnings\n' "$ERRORS" "$TOTAL"
    exit 1
fi

printf 'lint-shellcheck: all %d file(s) passed\n' "$TOTAL"
exit 0
