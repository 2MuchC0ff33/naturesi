#!/usr/bin/env yash
# test/smoke/seo.test.sh — smoke test: SEO basics on all HTML pages
# Checks: <title> exists, meta description present and reasonable length

set -u

HTML_FILES=$(find . -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/')
FAIL=0
CHECKED=0

for FILE in $HTML_FILES; do
    CHECKED=$((CHECKED + 1))

    # Join multiline content for pattern matching
    CONTENT=$(tr '\n' ' ' < "$FILE" 2>/dev/null)

    # Check <title> exists and is not empty
    TITLE=$(printf '%s' "$CONTENT" | grep -oE '<title>[^<]+</title>' \
        | sed 's/<title>//g;s/<\/title>//g')
    if [ -z "$TITLE" ]; then
        printf 'not ok %s: missing <title>\n' "$FILE"
        FAIL=$((FAIL + 1))
    else
        LEN=$(printf '%s' "$TITLE" | wc -c | tr -d '\n ')
        if [ "$LEN" -lt 10 ]; then
            printf 'not ok %s: <title> too short (%d chars)\n' "$FILE" "$LEN"
            FAIL=$((FAIL + 1))
        elif [ "$LEN" -gt 70 ]; then
            printf 'not ok %s: <title> too long (%d chars, max 70)\n' "$FILE" "$LEN"
            FAIL=$((FAIL + 1))
        else
            printf 'ok %s: <title> "%s" (%d chars)\n' "$FILE" "$TITLE" "$LEN"
        fi
    fi

    # Check meta description (using joined CONTENT)
    DESC=$(printf '%s' "$CONTENT" \
        | grep -oE '<meta[^>]+name="description"[^>]*content="[^"]*"' \
        | sed 's/.*content="//;s/".*//')
    if [ -z "$DESC" ]; then
        printf 'not ok %s: missing meta description\n' "$FILE"
        FAIL=$((FAIL + 1))
    else
        LEN=$(printf '%s' "$DESC" | wc -c | tr -d '\n ')
        if [ "$LEN" -lt 50 ]; then
            printf 'not ok %s: meta description too short (%d chars)\n' "$FILE" "$LEN"
            FAIL=$((FAIL + 1))
        elif [ "$LEN" -gt 160 ]; then
            printf 'not ok %s: meta description too long (%d chars, max 160)\n' "$FILE" "$LEN"
            FAIL=$((FAIL + 1))
        else
            printf 'ok %s: meta description (%d chars)\n' "$FILE" "$LEN"
        fi
    fi

    # Check lang attribute (using joined CONTENT)
    LANG=$(printf '%s' "$CONTENT" | grep -oE '<html[^>]+lang="[^"]*"' | sed 's/.*lang="//;s/".*//')
    if [ -z "$LANG" ]; then
        printf 'not ok %s: missing lang attribute on <html>\n' "$FILE"
        FAIL=$((FAIL + 1))
    else
        printf 'ok %s: lang="%s"\n' "$FILE" "$LANG"
    fi
done

if [ "$CHECKED" -eq 0 ]; then
    printf 'ok 1 no HTML files found (skip)\n'
    exit 0
fi

printf 'ok 1 checked SEO basics on %d page(s) (%d failures)\n' "$CHECKED" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
