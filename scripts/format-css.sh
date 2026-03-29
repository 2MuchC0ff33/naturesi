#!/bin/sh
# scripts/format-css.sh — Format CSS files with Prettier
# Usage: scripts/format-css.sh [file.css...]

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"

if [ $# -eq 0 ]; then
    FILES=$(find "$BASE_DIR/assets/css" -name '*.css' -type f 2>/dev/null)
    if [ -z "$FILES" ]; then
        printf 'No CSS files found.\n'
        exit 0
    fi
    npx prettier --write $FILES 2>&1 | head -20
else
    npx prettier --write "$@" 2>&1
fi

exit 0
