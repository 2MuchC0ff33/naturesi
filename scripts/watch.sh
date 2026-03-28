#!/usr/bin/env yash
# scripts/watch.sh — File change watcher with hot-reload
# Polls file mtimes; on change: touches reload.txt in repo root + triggers apache2 graceful
# Usage: scripts/watch.sh [--dir <root>] [--sleep <seconds>]
# Default root: .  Default sleep: 1 second

ROOT="."
SLEEP=1
# reload.txt goes in the repo root (served by apache at http://localhost/reload.txt)
RELOAD_MARKER="./reload.txt"
MTIME_FILE="/tmp/naturesi-watch-mtimes.txt"

while [ $# -gt 0 ]; do
    case "$1" in
        --dir)   ROOT="$2"; shift 2 ;;
        --sleep) SLEEP="$2"; shift 2 ;;
        *)       printf 'usage: %s [--dir <root>] [--sleep <seconds>]\n' "$0"; exit 1 ;;
    esac
done

# Resolve absolute path for reload marker
RELOAD_MARKER="$(cd "$(pwd)" && pwd)/reload.txt"

printf 'Watching %s for changes (sleep=%ss)...\n' "$(pwd)/$ROOT" "$SLEEP"
printf 'On change: touch %s + apache2 graceful\n' "$RELOAD_MARKER"
printf 'Press Ctrl+C to stop.\n\n'

# Build initial file list
INITIAL=$(mktemp)
find "$ROOT" -type f \( \
    -name '*.html' -o \
    -name '*.css' -o \
    -name '*.js' -o \
    -name '*.json' -o \
    -name '*.csv' -o \
    -name '*.svg' \
    \) ! -name 'reload.txt' 2>/dev/null > "$INITIAL"

# Capture initial mtimes
LAST_FILE=$(mktemp)
while IFS= read -r f; do
    stat -c '%Y %n' "$f" 2>/dev/null || true
done < "$INITIAL" > "$LAST_FILE"
rm -f "$INITIAL"

on_change() {
    changed_file="$1"
    timestamp=$(date +%s)
    printf '[%s] Change detected: %s\n' "$(date '+%H:%M:%S')" "$changed_file"
    printf '%s\n' "$timestamp" > "$RELOAD_MARKER"
    # Trigger apache2 graceful reload (optional — browser polling handles the reload)
    if command -v apache2ctl >/dev/null 2>&1; then
        sudo apache2ctl graceful 2>/dev/null &
    elif command -v systemctl >/dev/null 2>&1; then
        sudo systemctl reload apache2 2>/dev/null &
    fi
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
        \) ! -name 'reload.txt' 2>/dev/null > "$CURRENT"

    while IFS= read -r f; do
        mtime=$(stat -c '%Y' "$f" 2>/dev/null || echo "0")
        prev=$(grep -F "$f" "$LAST_FILE" 2>/dev/null | cut -d' ' -f1 || true)
        if [ -n "$prev" ] && [ "$mtime" != "$prev" ]; then
            on_change "$f"
        fi
        # Add new files to tracking
        if ! grep -Fqs "$f " "$LAST_FILE" 2>/dev/null; then
            printf '%s %s\n' "$mtime" "$f" >> "$LAST_FILE"
        fi
    done < "$CURRENT"

    # Update mtimes
    TMP_LAST=$(mktemp)
    while IFS= read -r f; do
        mtime=$(stat -c '%Y' "$f" 2>/dev/null || echo "0")
        printf '%s %s\n' "$mtime" "$f"
    done < "$CURRENT" > "$TMP_LAST"
    mv "$TMP_LAST" "$LAST_FILE"
    rm -f "$CURRENT"

    sleep "$SLEEP"
done
