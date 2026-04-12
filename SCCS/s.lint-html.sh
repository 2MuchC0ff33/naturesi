h64876
s 00089/00000/00000
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
# scripts/lint-html.sh — POSIX HTML lint checks
# Checks: DOCTYPE, lang="en-AU", charset, viewport, <label for>, alt on images

usage() {
    printf 'usage: %s <file.html>\n' "$0"
    exit 1
}

if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    usage
fi

FILE="$1"
ERRORS=0

if [ ! -f "$FILE" ]; then
    printf 'ERROR: file not found: %s\n' "$FILE" >&2
    exit 1
fi

printf 'Checking: %s\n' "$FILE"

# 1. DOCTYPE on line 1
FIRST=$(sed 1q "$FILE")
DOCHECK=$(printf '%s' "$FIRST" | grep -iE '^<!doctype html>' || true)
if [ -z "$DOCHECK" ]; then
    printf '  FAIL: missing <!DOCTYPE html> on line 1\n'
    ERRORS=$((ERRORS + 1))
else
    printf '  OK: DOCTYPE present\n'
fi

# 2. <html lang="en-AU">
if grep -qiE '<html[^>]*lang="en-AU"' "$FILE"; then
    printf '  OK: lang="en-AU" found\n'
else
    printf '  FAIL: missing <html lang="en-AU">\n'
    ERRORS=$((ERRORS + 1))
fi

# 3. Meta charset
if grep -qiE '<meta[^>]+charset' "$FILE"; then
    printf '  OK: meta charset found\n'
else
    printf '  FAIL: missing meta charset\n'
    ERRORS=$((ERRORS + 1))
fi

# 4. Meta viewport
if grep -qiE '<meta[^>]+viewport' "$FILE"; then
    printf '  OK: meta viewport found\n'
else
    printf '  FAIL: missing meta viewport\n'
    ERRORS=$((ERRORS + 1))
fi

# 5. Form inputs with <label for> bindings
INPUT_COUNT=$(grep -cE '<input[^>]*>' "$FILE" || true)
if [ -n "$INPUT_COUNT" ] && [ "$INPUT_COUNT" -gt 0 ] 2>/dev/null; then
    LABEL_COUNT=$(grep -cE '<label[^>]+for=' "$FILE" || true)
    if [ -z "$LABEL_COUNT" ]; then LABEL_COUNT=0; fi
    printf '  INFO: %d <input> tags, %d <label for=> bindings\n' "$INPUT_COUNT" "$LABEL_COUNT"
fi

# 6. Images with alt or role="presentation"
IMG_COUNT=$(grep -cE '<img[^>]*>' "$FILE" || true)
if [ -n "$IMG_COUNT" ] && [ "$IMG_COUNT" -gt 0 ] 2>/dev/null; then
    ALT_COUNT=$(grep -cE '<img[^>]+alt=' "$FILE" || true)
    if [ -z "$ALT_COUNT" ]; then ALT_COUNT=0; fi
    PRES_COUNT=$(grep -cE '<img[^>]+role="presentation"' "$FILE" || true)
    if [ -z "$PRES_COUNT" ]; then PRES_COUNT=0; fi
    if [ -n "$ALT_COUNT" ] && [ -n "$PRES_COUNT" ]; then
        MISSING=$((IMG_COUNT - ALT_COUNT - PRES_COUNT))
        if [ "$MISSING" -gt 0 ] 2>/dev/null; then
            printf '  WARN: %d images missing alt or role="presentation"\n' "$MISSING"
        else
            printf '  OK: all %d images have alt or role="presentation"\n' "$IMG_COUNT"
        fi
    fi
fi

if [ "$ERRORS" -gt 0 ] 2>/dev/null; then
    printf '\n%d error(s) found.\n' "$ERRORS" >&2
    exit 1
fi

printf '\nAll checks passed.\n'
exit 0
E 1
