h43104
s 00091/00000/00000
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
# scripts/watch.sh — File change watcher
# Polls file mtimes; outputs changed file paths to stdout
# Usage: scripts/watch.sh [--dir <root>] [--sleep <seconds>]
# Default root: .  Default sleep: 1 second

ROOT="."
SLEEP=1

# Portable mtime: GNU stat uses -c '%Y', BSD/macOS stat uses -f '%m'
get_mtime() {
    case "$(uname -s)" in
        Darwin|*BSD) stat -f '%m' "$1" 2>/dev/null ;;
        *)           stat -c '%Y' "$1" 2>/dev/null ;;
    esac
}


while [ $# -gt 0 ]; do
    case "$1" in
        --dir)   ROOT="$2"; shift 2 ;;
        --sleep) SLEEP="$2"; shift 2 ;;
        *)       printf 'usage: %s [--dir <root>] [--sleep <seconds>]\n' "$0"; exit 1 ;;
    esac
done

printf 'Watching %s for changes (sleep=%ss)...\n' "$(pwd)/$ROOT" "$SLEEP"
printf 'On change: prints changed file path\n'
printf 'Press Ctrl+C to stop.\n\n'

INITIAL=$(mktemp)
find "$ROOT" -type f \( \
    -name '*.html' -o \
    -name '*.css' -o \
    -name '*.js' -o \
    -name '*.json' -o \
    -name '*.csv' -o \
    -name '*.svg' \
    \) 2>/dev/null > "$INITIAL"

LAST_FILE=$(mktemp)
while IFS= read -r f; do
    mtime=$(get_mtime "$f") || true
    printf '%s %s\n' "${mtime:-0}" "$f"
done < "$INITIAL" > "$LAST_FILE"
rm -f "$INITIAL"

on_change() {
    printf '%s\n' "$1"
}

while true; do
    CURRENT=$(mktemp)
    find "$ROOT" -type f \( \
        -name '*.html' -o \
        -name '*.css' -o \
        -name '*.js' -o \
        -name '*.json' -o \
        -name '*.csv' -o \
        -name '*.svg' \
        \) 2>/dev/null > "$CURRENT"

    while IFS= read -r f; do
<<<<<<< HEAD
        mtime=$(get_mtime "$f" || echo "0")
=======
        mtime=$(stat -c '%Y' "$f" 2>/dev/null || echo "0")
>>>>>>> feature/enhance-ui-ux
        prev=$(grep -F "$f" "$LAST_FILE" 2>/dev/null | cut -d' ' -f1 || true)
        if [ -n "$prev" ] && [ "$mtime" != "$prev" ]; then
            on_change "$f"
        fi
        if ! grep -Fqs "$f " "$LAST_FILE" 2>/dev/null; then
            printf '%s %s\n' "$mtime" "$f" >> "$LAST_FILE"
        fi
    done < "$CURRENT"

    TMP_LAST=$(mktemp)
    while IFS= read -r f; do
<<<<<<< HEAD
        mtime=$(get_mtime "$f" || echo "0")
=======
        mtime=$(stat -c '%Y' "$f" 2>/dev/null || echo "0")
>>>>>>> feature/enhance-ui-ux
        printf '%s %s\n' "$mtime" "$f"
    done < "$CURRENT" > "$TMP_LAST"
    mv "$TMP_LAST" "$LAST_FILE"
    rm -f "$CURRENT"

    sleep "$SLEEP"
done
E 1
