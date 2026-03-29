#!/bin/sh
# scripts/serve.sh — Apache2 local dev server control
# Usage: scripts/serve.sh start|stop|reload|status

set -u

CMD="${1:-}"

case "$CMD" in
    start)
        printf 'Starting apache2...\n'
        if command -v apache2ctl >/dev/null 2>&1; then
            sudo apache2ctl start
        elif command -v systemctl >/dev/null 2>&1; then
            sudo systemctl start apache2
        else
            printf 'ERROR: apache2ctl and systemctl not found. Is Apache2 installed?\n' >&2
            exit 1
        fi
        ;;
    stop)
        printf 'Stopping apache2...\n'
        if command -v apache2ctl >/dev/null 2>&1; then
            sudo apache2ctl stop
        elif command -v systemctl >/dev/null 2>&1; then
            sudo systemctl stop apache2
        else
            printf 'ERROR: apache2ctl and systemctl not found.\n' >&2
            exit 1
        fi
        ;;
    reload|graceful)
        printf 'Gracefully reloading apache2...\n'
        if command -v apache2ctl >/dev/null 2>&1; then
            sudo apache2ctl graceful
        elif command -v systemctl >/dev/null 2>&1; then
            sudo systemctl reload apache2
        else
            printf 'ERROR: apache2ctl and systemctl not found.\n' >&2
            exit 1
        fi
        ;;
    status)
        if command -v apache2ctl >/dev/null 2>&1; then
            apache2ctl -S 2>&1 || true
        elif command -v systemctl >/dev/null 2>&1; then
            sudo systemctl status apache2 --no-pager 2>&1 || true
        else
            printf 'ERROR: apache2ctl and systemctl not found.\n' >&2
            exit 1
        fi
        ;;
    *)
        printf 'usage: %s {start|stop|reload|status}\n' "$0"
        exit 1
        ;;
esac

exit 0
