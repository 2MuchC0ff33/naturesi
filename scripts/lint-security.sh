#!/bin/sh
# scripts/lint-security.sh — Security surface checks
# FAIL on: inline event handlers, javascript: URLs, hardcoded secrets

set -u

usage() {
    printf 'usage: %s [file...]\n' "$0"
    exit 1
}

if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    find . -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.sh' 2>/dev/null \
        | grep -v '/node_modules/' | while IFS= read -r f; do
        "$0" "$f"
    done
    exit 0
fi

ERRORS=0
for FILE in "$@"; do
    if [ ! -f "$FILE" ]; then
        continue
    fi

    printf 'Checking: %s\n' "$FILE"

    # 1. No inline event handlers (onclick=, onerror=, onload=, onmouseover=, etc.)
    INLINE_HANDLERS=$(grep -nE 'onclick=|onerror=|onload=|onmouseover=|onmouseout=|onfocus=|onblur=' "$FILE" 2>/dev/null || true)
    if [ -n "$INLINE_HANDLERS" ]; then
        printf '  FAIL: inline event handler(s) found\n'
        printf '%s\n' "$INLINE_HANDLERS" | head -5
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no inline event handlers\n'
    fi

    # 2. No javascript: URLs in hrefs
    if grep -qiE 'href\s*=\s*["'\'']?javascript:' "$FILE" 2>/dev/null; then
        printf '  FAIL: javascript: URL found in href\n'
        grep -nE 'href\s*=\s*["'\'']?javascript:' "$FILE" | head -3
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no javascript: URLs\n'
    fi

    # 3. No target="_blank" without rel="noopener" (in HTML)
    if printf '%s' "$FILE" | grep -qE '\.html$'; then
        BAD_BLANK=$(grep -nE 'target\s*=\s*["'\'']_blank["'\'']' "$FILE" 2>/dev/null \
            | grep -v 'rel\s*=\s*["'\''][^"'\'']*noopener' \
            || true)
        if [ -n "$BAD_BLANK" ]; then
            printf '  WARN: target="_blank" without rel="noopener"\n'
            printf '%s\n' "$BAD_BLANK" | head -3
        else
            printf '  OK: target="_blank" has rel="noopener"\n'
        fi
    fi

    # 4. No hardcoded email addresses (basic pattern)
    # Exclude HTML pattern= attributes and placeholder values
    if grep -qE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' "$FILE" 2>/dev/null; then
        EMAILS=$(grep -nE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' "$FILE" 2>/dev/null \
            | grep -vE '(example\.org|example\.com|your-|naturesinfusions|naturesi|pattern=)' \
            | head -5 || true)
        if [ -n "$EMAILS" ]; then
            printf '  WARN: potential hardcoded email address (review manually)\n'
            printf '%s\n' "$EMAILS" | head -3
        else
            printf '  OK: no hardcoded emails\n'
        fi
    else
        printf '  OK: no hardcoded emails\n'
    fi

    # 5. No API key patterns (AIza..., sk_live..., pk_live..., etc.)
    if grep -qE '(AIza|sk_live|pk_live|api[_-]?key|secret[_-]?key)\s*[=:]\s*["'\'']?[a-zA-Z0-9_-]{20,}' "$FILE" 2>/dev/null; then
        printf '  FAIL: potential hardcoded API key or secret\n'
        grep -nE '(AIza|sk_live|pk_live|api[_-]?key|secret[_-]?key)\s*[=:]\s*["'\'']?[a-zA-Z0-9_-]{20,}' "$FILE" | head -3
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no hardcoded API keys\n'
    fi

    # 6. No bearer token patterns
    if grep -qE 'Bearer\s+[a-zA-Z0-9_-]{20,}' "$FILE" 2>/dev/null; then
        printf '  FAIL: potential bearer token\n'
        grep -nE 'Bearer\s+[a-zA-Z0-9_-]{20,}' "$FILE" | head -3
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no bearer tokens\n'
    fi

    # 7. No innerHTML with dynamic user content (basic pattern)
    if grep -qE 'innerHTML\s*=.*\$\{|innerHTML\s*=.*getElementById|innerHTML\s*=.*querySelector' "$FILE" 2>/dev/null; then
        printf '  WARN: innerHTML with dynamic content (consider textContent or sanitisation)\n'
    else
        printf '  OK: no suspicious innerHTML patterns\n'
    fi

    printf '\n'
done

if [ "$ERRORS" -gt 0 ] 2>/dev/null; then
    printf '%d error(s) found.\n' "$ERRORS" >&2
    exit 1
fi

printf 'All checks passed.\n'
exit 0
