h47903
s 00165/00000/00000
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
# scripts/lint-dead-code.sh — Dead code and orphaned file detection
# REPORT/WARN on: orphaned files, dead code, empty files, duplicate files

set -u

ERRORS=0
printf '=== Dead Code & Orphaned File Checks ===\n\n'

# 1. Empty files (0 bytes)
printf '%s\n' '--- Empty files (0 bytes) ---'
EMPTY=$(find . -type f -size 0 2>/dev/null \
    | grep -v '/node_modules/' \
    | grep -v '/.git/' \
    | grep -v '.gitkeep' \
    | head -10)
if [ -n "$EMPTY" ]; then
    printf '  WARN: empty file(s) found:\n'
    printf '%s\n' "$EMPTY"
    ERRORS=$((ERRORS + 1))
else
    printf '  OK: no empty files\n'
fi

# 2. Orphaned CSS files (not imported in main.css)
printf '\n%s\n' '--- Orphaned CSS files ---'
IMPORTED_CSS=$(grep -oE '@import url\([^)]+\)' assets/css/main.css 2>/dev/null \
    | sed "s/@import url('//;s/')//;s/@import url(//;s/)//" \
    | while IFS= read -r f; do
        # Resolve relative path
        printf '%s\n' "$f"
    done)

# Get all CSS files
ALL_CSS=$(find assets/css -name '*.css' -type f 2>/dev/null)
ORPHANED_CSS=""
for f in $ALL_CSS; do
    # Check if file or its basename is referenced in main.css
    BASENAME=$(basename "$f")
    if ! grep -q "$f" assets/css/main.css 2>/dev/null && \
       ! grep -q "$BASENAME" assets/css/main.css 2>/dev/null; then
        # Allow partials that are @import'd indirectly
        if ! grep -rq "$BASENAME" assets/css/ 2>/dev/null; then
            ORPHANED_CSS="$ORPHANED_CSS  $f\n"
        fi
    fi
done
if [ -n "$ORPHANED_CSS" ]; then
    printf '  WARN: potentially orphaned CSS file(s) (not imported in main.css):\n'
    printf '%b' "$ORPHANED_CSS" | head -10
else
    CSS_COUNT=$(find assets/css -name '*.css' -type f 2>/dev/null | wc -l | tr -d ' ')
    printf '  OK: all %d CSS files are imported\n' "$CSS_COUNT"
fi

# 3. Orphaned JS files (not referenced in any HTML)
printf '\n%s\n' '--- Orphaned JS files ---'
ALL_JS=$(find assets/js -name '*.js' -type f 2>/dev/null)
ORPHANED_JS=""
for f in $ALL_JS; do
    BASENAME=$(basename "$f")
    if ! grep -rq "$f\|/assets/js/.*$BASENAME" pages/ index.html 2>/dev/null; then
        ORPHANED_JS="$ORPHANED_JS  $f\n"
    fi
done
if [ -n "$ORPHANED_JS" ]; then
    COUNT=$(printf '%b' "$ORPHANED_JS" | wc -l | tr -d ' ')
    printf '  INFO: %d JS file(s) not referenced in HTML:\n' "$COUNT"
    printf '%b' "$ORPHANED_JS" | head -10
else
    JS_COUNT=$(find assets/js -name '*.js' -type f 2>/dev/null | wc -l | tr -d ' ')
    printf '  OK: all %d JS files are referenced in HTML\n' "$JS_COUNT"
fi

# 4. Orphaned image files (not referenced in any HTML/CSS/JS)
printf '\n%s\n' '--- Orphaned image files ---'
ALL_IMGS=$(find assets/img -type f \( -name '*.webp' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' -o -name '*.gif' -o -name '*.svg' \) 2>/dev/null)
ORPHANED_IMGS=""
for f in $ALL_IMGS; do
    BASENAME=$(basename "$f")
    if ! grep -rq "$f\|/$BASENAME" pages/ index.html assets/css/ assets/js/ 2>/dev/null; then
        ORPHANED_IMGS="$ORPHANED_IMGS  $f\n"
    fi
done
if [ -n "$ORPHANED_IMGS" ]; then
    COUNT=$(printf '%b' "$ORPHANED_IMGS" | wc -l | tr -d ' ')
    printf '  INFO: %d image file(s) not referenced:\n' "$COUNT"
    printf '%b' "$ORPHANED_IMGS" | head -10
else
    IMG_COUNT=$(find assets/img -type f 2>/dev/null | wc -l | tr -d ' ')
    printf '  OK: all %d image files are referenced\n' "$IMG_COUNT"
fi

# 5. Dead CSS classes (defined but never used in HTML)
printf '\n%s\n' '--- Dead CSS class definitions ---'
CSS_FILES=$(find assets/css -name '*.css' -type f 2>/dev/null)
UNUSED_CLASSES=""
for css in $CSS_FILES; do
    CLASSES=$(grep -oE '\.-?[a-zA-Z_][a-zA-Z0-9_-]*' "$css" 2>/dev/null \
        | grep -vE '^-' \
        | sort | uniq)
    for CLASS in $CLASSES; do
        if ! grep -rq "$CLASS" pages/ index.html 2>/dev/null; then
            # Allow utility classes (u-, ., test-)
            if ! printf '%s' "$CLASS" | grep -qE '^(u-|u\.)'; then
                UNUSED_CLASSES="$UNUSED_CLASSES  $CLASS (in $css)\n"
            fi
        fi
    done
done
if [ -n "$UNUSED_CLASSES" ]; then
    COUNT=$(printf '%b' "$UNUSED_CLASSES" | wc -l | tr -d ' ')
    printf '  INFO: %d CSS class(es) defined but not used:\n' "$COUNT"
    printf '%b' "$UNUSED_CLASSES" | head -10
else
    printf '  OK: no obvious unused CSS classes\n'
fi

# 6. Duplicate files (identical content via checksum)
printf '\n%s\n' '--- Duplicate files (identical content) ---'
TMPDUPS=$(mktemp)
find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' 2>/dev/null \
    | while IFS= read -r f; do
    [ -s "$f" ] && cksum "$f" 2>/dev/null || true
done | awk '{print $1, $3}' | sort | uniq -D -w10 \
    | while IFS= read -r sum f; do
    echo "  $f"
done > "$TMPDUPS"
if [ -s "$TMPDUPS" ]; then
    printf '  INFO: duplicate file(s) with same checksum:\n'
    head -20 < "$TMPDUPS"
else
    printf '  OK: no duplicate files found\n'
fi
rm -f "$TMPDUPS"

# 7. Obsolete file patterns (e.g., cart.svg replaced by cart.webp)
printf '\n%s\n' '--- Obsolete file patterns ---'
OBSOLETE=""
for pattern in 'cart.svg'; do
    FOUND=$(find assets -name "$pattern" -type f 2>/dev/null || true)
    if [ -n "$FOUND" ]; then
        for f in $FOUND; do
            BASENAME=$(basename "$f" .svg)
            WEBP_FOUND=$(find assets -name "${BASENAME}.webp" -type f 2>/dev/null || true)
            if [ -n "$WEBP_FOUND" ]; then
                OBSOLETE="$OBSOLETE  $f (replaced by ${BASENAME}.webp)\n"
            fi
        done
    fi
done
if [ -n "$OBSOLETE" ]; then
    printf '  INFO: obsolete file(s) (replacement exists):\n'
    printf '%b' "$OBSOLETE" | head -10
else
    printf '  OK: no obsolete replacement files found\n'
fi

printf '\n'
if [ "$ERRORS" -gt 0 ] 2>/dev/null; then
    printf '%d warning(s) found.\n' "$ERRORS" >&2
fi

printf 'Dead code check complete.\n'
exit 0
E 1
