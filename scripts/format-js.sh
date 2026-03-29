#!/bin/sh
# scripts/format-js.sh — Format JS files with Prettier
# Usage: scripts/format-js.sh [file.js...]

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"

if [ $# -eq 0 ]; then
    FILES=$(find "$BASE_DIR" -name '*.js' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/.git/' | grep -v '/service-worker' | grep -v '/workers/')
    if [ -z "$FILES" ]; then
        printf 'No JS files found.\n'
        exit 0
    fi
    npx prettier --write $FILES 2>&1 | head -20
else
    npx prettier --write "$@" 2>&1
fi

exit 0
