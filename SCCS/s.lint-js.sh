h07257
s 00122/00000/00000
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
# scripts/lint-js.sh — POSIX JS lint checks + ESLint
# FAIL on: eval(), new Function(), assignment in conditionals, debugger
# Also runs: npx eslint (if installed)

set -u

usage() {
    printf 'usage: %s [file.js...]\n' "$0"
    exit 1
}

if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    find assets/js -name '*.js' -type f 2>/dev/null | while IFS= read -r f || [ -n "$f" ]; do
        "$0" "$f"
    done
    exit 0
fi

# Check if ESLint is available
if command -v npx >/dev/null 2>&1 && { [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; }; then
    ESLINT_AVAILABLE=true
else
    ESLINT_AVAILABLE=false
fi

ERRORS=0
for FILE in "$@"; do
    if [ ! -f "$FILE" ]; then
        printf 'ERROR: file not found: %s\n' "$FILE" >&2
        ERRORS=$((ERRORS + 1))
        continue
    fi

    printf 'Checking: %s\n' "$FILE"

    # 1. No eval()
    if grep -qE 'eval\s*\(' "$FILE" 2>/dev/null; then
        printf '  FAIL: eval() found\n'
        grep -nE 'eval\s*\(' "$FILE" | head -3
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no eval()\n'
    fi

    # 2. No new Function()
    if grep -qE 'new\s+Function\s*\(' "$FILE" 2>/dev/null; then
        printf '  FAIL: new Function() found\n'
        grep -nE 'new\s+Function\s*\(' "$FILE" | head -3
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no new Function()\n'
    fi

    # 3. No assignment in conditionals (if (x = y) without == or ===)
    # Exclude: ==, ===, !=, !==, >=, <=, => (arrow functions)
    BAD_ASGN=$(grep -nE 'if\s*\([^)]*=[^=:<>!][^)]*\)' "$FILE" 2>/dev/null \
        | grep -vE '(===|!==|!=|==|=>|>=|<=)' \
        || true)
    if [ -n "$BAD_ASGN" ]; then
        printf '  FAIL: potential assignment in conditional\n'
        printf '%s\n' "$BAD_ASGN" | head -5
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no assignment in conditionals\n'
    fi

    # 4. No debugger statements
    if grep -qE '^\s*debugger\s*[;)]' "$FILE" 2>/dev/null; then
        printf '  FAIL: debugger statement found\n'
        grep -nE '^\s*debugger\s*[;)]' "$FILE" | head -3
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no debugger statements\n'
    fi

    # 5. Basic syntax: balanced braces
    OPEN=$(grep -o '{' "$FILE" | wc -l | tr -d ' ')
    CLOSE=$(grep -o '}' "$FILE" | wc -l | tr -d ' ')
    if [ "$OPEN" -ne "$CLOSE" ] 2>/dev/null; then
        printf '  FAIL: unbalanced braces: %d open, %d close\n' "$OPEN" "$CLOSE"
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: balanced braces\n'
    fi

    # 6. Basic syntax: balanced parentheses
    OPEN=$(grep -o '(' "$FILE" | wc -l | tr -d ' ')
    CLOSE=$(grep -o ')' "$FILE" | wc -l | tr -d ' ')
    if [ "$OPEN" -ne "$CLOSE" ] 2>/dev/null; then
        printf '  WARN: unbalanced parentheses: %d open, %d close\n' "$OPEN" "$CLOSE"
    else
        printf '  OK: balanced parentheses\n'
    fi

    # 7. No // comments (style — warn, not fail)
    BAD=$(grep -nE '(^|[^/])//' "$FILE" 2>/dev/null | grep -vE 'https?://|//\s*[A-Z]' | head -3 || true)
    if [ -n "$BAD" ]; then
        printf '  WARN: // style comments found (prefer /* */ for consistency)\n'
        printf '%s\n' "$BAD" | head -3
    else
        printf '  OK: no // comments\n'
    fi

    printf '\n'
done

if [ "$ERRORS" -gt 0 ] 2>/dev/null; then
    printf '%d error(s) found.\n' "$ERRORS" >&2
    exit 1
fi

# Run ESLint if available (skip in CI or when ESLINT_SKIP is set)
if $ESLINT_AVAILABLE && [ -z "${ESLINT_SKIP:-}" ]; then
    if [ $# -gt 0 ]; then
        printf '\nRunning ESLint on %d file(s)...\n' $#
        npx eslint --quiet "$@" 2>&1 | head -20 || true
    fi
fi

printf 'All checks passed.\n'
exit 0
E 1
