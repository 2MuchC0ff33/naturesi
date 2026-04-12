h49315
s 00021/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/bin/sh
# scripts/format-html.sh — Format HTML files with Prettier
# Usage: scripts/format-html.sh [file.html...]

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"

if [ $# -eq 0 ]; then
    FILES=$(find "$BASE_DIR" -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/.git/')
    if [ -z "$FILES" ]; then
        printf 'No HTML files found.\n'
        exit 0
    fi
    npx prettier --write $FILES 2>&1 | head -20
else
    npx prettier --write "$@" 2>&1
fi

exit 0
E 1
