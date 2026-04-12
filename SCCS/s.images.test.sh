h04065
s 00068/00000/00000
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
# test/smoke/images.test.sh — smoke test: all referenced images exist on disk

set -u

HTML_FILES=$(find . -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/')
CSS_FILES=$(find assets/css -name '*.css' -type f 2>/dev/null)
FAIL=0
CHECKED=0

check_file() {
    IMG="$1"
    DIR="$2"
    if printf '%s' "$IMG" | grep -qE '^/'; then
        TARGET="${IMG#.}"
        TARGET="${TARGET#/}"      # strip leading / to make relative to repo root
    elif printf '%s' "$IMG" | grep -qE '^\.\./'; then
        TARGET="$DIR/$IMG"
    else
        TARGET="$DIR/$IMG"
    fi
    while printf '%s' "$TARGET" | grep -qE '/\.\./'; do
        TARGET=$(printf '%s' "$TARGET" | sed 's|/[^/]*/\.\./|/|')
    done
    TARGET="${TARGET#./}"
    if [ ! -f "$TARGET" ]; then
        printf 'not ok missing image: %s\n' "$TARGET"
        return 1
    fi
    return 0
}

# Check HTML files
for FILE in $HTML_FILES; do
    DIR=$(dirname "$FILE")
    IMGS=$(grep -oE 'src="[^"#?]*\.(webp|jpg|jpeg|png|gif|svg)"' "$FILE" 2>/dev/null \
        | sed 's/src="//;s/"$//' \
        || true)
    for IMG in $IMGS; do
        CHECKED=$((CHECKED + 1))
        check_file "$IMG" "$DIR" || FAIL=$((FAIL + 1))
    done
done

# Check CSS files
for FILE in $CSS_FILES; do
    DIR=$(dirname "$FILE")
    IMGS=$(grep -oE 'url\([^)]*\.(webp|jpg|jpeg|png|gif|svg)\)' "$FILE" 2>/dev/null \
        | sed "s/url('//;s/url(\"//;s/url(//;s/')$//;s/\")$//" \
        | grep -vE '^https?://' \
        || true)
    for IMG in $IMGS; do
        CHECKED=$((CHECKED + 1))
        check_file "$IMG" "$DIR" || FAIL=$((FAIL + 1))
    done
done

if [ "$CHECKED" -eq 0 ]; then
    printf 'ok 1 no images found (skip)\n'
    exit 0
fi

printf 'ok 1 checked %d image reference(s) (%d failures)\n' "$CHECKED" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
E 1
