h04791
s 00059/00000/00000
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
E 1
