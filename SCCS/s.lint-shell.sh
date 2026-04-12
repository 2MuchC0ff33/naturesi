h00176
s 00141/00000/00000
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
# scripts/lint-shell.sh — POSIX Shell lint checks
# FAIL on: bash-isms ([[, $RANDOM, local in sh), wrong shebang, missing set flags

set -u

usage() {
    printf 'usage: %s [file.sh...]\n' "$0"
    exit 1
}

if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    find . -name '*.sh' -type f 2>/dev/null | grep -v '/node_modules/' | while IFS= read -r f; do
        "$0" "$f"
    done
    exit 0
fi

ERRORS=0
for FILE in "$@"; do
    if [ ! -f "$FILE" ]; then
        printf 'ERROR: file not found: %s\n' "$FILE" >&2
        ERRORS=$((ERRORS + 1))
        continue
    fi

    printf 'Checking: %s\n' "$FILE"

    LINES=$(wc -l < "$FILE" 2>/dev/null || echo 0)

    # 1. Shebang check
    SHEBANG=$(sed 1q "$FILE")
    if [ -z "$SHEBANG" ]; then
        printf '  WARN: no shebang found\n'
    elif printf '%s' "$SHEBANG" | grep -qE '^#!/'; then
        if printf '%s' "$SHEBANG" | grep -qE '#!/usr/bin/env\s+(sh|bash)'; then
            printf '  OK: shebang: %s\n' "$SHEBANG"
        elif printf '%s' "$SHEBANG" | grep -qE '#!/bin/(sh|bash)'; then
            printf '  OK: shebang: %s\n' "$SHEBANG"
        else
            printf '  WARN: non-standard shebang: %s\n' "$SHEBANG"
        fi
    fi

    # 2. No [[ bash-ism in sh scripts (but allow [[ in sed character classes)
    if printf '%s' "$SHEBANG" | grep -qE '/sh$'; then
        BASHISM=$(grep -nE '\[\[' "$FILE" 2>/dev/null \
            | sed 's/^[0-9]*://' \
            | grep -vE '^[[:space:]]*#' \
            | grep -vE ":space:|:word:|:digit:|:alpha:|:alnum:" \
            | head -5 || true)
        if [ -n "$BASHISM" ]; then
            printf '  FAIL: [[ bash-ism found in yash/sh script\n'
            printf '%s\n' "$BASHISM" | head -3
            ERRORS=$((ERRORS + 1))
        else
            printf '  OK: no [[ bash-ism\n'
        fi
    fi

    # 3. No $RANDOM (exclude comment lines and string literals)
    if grep -qE '\$RANDOM' "$FILE" 2>/dev/null; then
        REAL_RANDOM=$(grep -nE '\$RANDOM' "$FILE" 2>/dev/null \
            | sed 's/^[0-9]*://' \
            | grep -vE '^[[:space:]]*#' \
            | grep -vE "^[[:space:]]*printf.*'.*'.*'" \
            | head -5 || true)
        if [ -n "$REAL_RANDOM" ]; then
            printf '  FAIL: $RANDOM bash-ism found\n'
            printf '%s\n' "$REAL_RANDOM" | head -3
            ERRORS=$((ERRORS + 1))
        else
            printf '  OK: no $RANDOM\n'
        fi
    else
        printf '  OK: no $RANDOM\n'
    fi

    # 4. No local in #!/bin/sh scripts
    if printf '%s' "$SHEBANG" | grep -qE '#!/bin/sh\b'; then
        if grep -qE '^[[:space:]]*local\s+' "$FILE" 2>/dev/null; then
            printf '  FAIL: local keyword in #!/bin/sh script\n'
            grep -nE '^[[:space:]]*local\s+' "$FILE" | head -3
            ERRORS=$((ERRORS + 1))
        else
            printf '  OK: no local keyword\n'
        fi
    fi

    # 5. Missing set flags in scripts > 20 lines
    if [ "$LINES" -gt 20 ] 2>/dev/null; then
        if ! grep -qE '^set\s+-[a-zA-Z]' "$FILE" 2>/dev/null; then
            printf '  WARN: no set flags in script > 20 lines (consider set -eu)\n'
        else
            printf '  OK: set flags present\n'
        fi
    fi

    # 6. No unquoted variables (basic pattern)
    BAD_UNQUOTED=$(grep -nE '\$[a-zA-Z_][a-zA-Z0-9_]*[^"'"'"'$a-zA-Z0-9_/{;)]' "$FILE" 2>/dev/null \
        | grep -vE '\$\{[a-zA-Z_]|"\$|'"'"'\$' | head -5 || true)
    if [ -n "$BAD_UNQUOTED" ]; then
        printf '  WARN: potentially unquoted variables\n'
        printf '%s\n' "$BAD_UNQUOTED" | head -3
    else
        printf '  OK: no obvious unquoted variables\n'
    fi

    # 7. No echo $VAR (should be echo "$VAR")
    BAD_ECHO=$(grep -nE 'echo\s+\\\$[a-zA-Z_]' "$FILE" 2>/dev/null | head -5 || true)
    if [ -n "$BAD_ECHO" ]; then
        printf '  WARN: echo $VAR without quotes (prefer echo "$VAR")\n'
        printf '%s\n' "$BAD_ECHO" | head -3
    else
        printf '  OK: no echo with unquoted variables\n'
    fi

    # 8. No tabs for indentation
    if grep -qE "$(printf '\t')" "$FILE" 2>/dev/null; then
        printf '  WARN: tabs found for indentation (use spaces)\n'
    else
        printf '  OK: no tabs for indentation\n'
    fi

    # 9. Consistent exit codes
    if ! grep -qE 'exit\s+[0-9]' "$FILE" 2>/dev/null; then
        printf '  INFO: no explicit exit statement\n'
    else
        printf '  OK: explicit exit statement found\n'
    fi

    printf '\n'
done

if [ "$ERRORS" -gt 0 ] 2>/dev/null; then
    printf '%d error(s) found.\n' "$ERRORS" >&2
    exit 1
fi

printf 'All checks passed.\n'
exit 0
E 1
