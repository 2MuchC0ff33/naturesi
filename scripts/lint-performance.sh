#!/usr/bin/env yash
# scripts/lint-performance.sh — Performance baseline checks
# FAIL on: images > 3MB, videos > 10MB, CSS > 50KB, JS > 50KB

set -u

ERRORS=0
printf '=== Performance Checks ===\n\n'

# 1. Images over 3MB
printf '%s\n' '--- Image files (max 3MB) ---'
LARGE_IMGS=$(find assets -type f \( -name '*.webp' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' -o -name '*.gif' \) \
    -size +3M 2>/dev/null | head -10)
if [ -n "$LARGE_IMGS" ]; then
    printf '  FAIL: images over 3MB found\n'
    printf '%s\n' "$LARGE_IMGS"
    ERRORS=$((ERRORS + 1))
else
    IMG_COUNT=$(find assets -type f \( -name '*.webp' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' -o -name '*.gif' \) 2>/dev/null | wc -l | tr -d ' ')
    printf '  OK: no images over 3MB (%d images checked)\n' "$IMG_COUNT"
fi

# 2. Videos over 10MB
printf '\n%s\n' '--- Video files (max 10MB) ---'
LARGE_VIDS=$(find assets -type f \( -name '*.mp4' -o -name '*.webm' -o -name '*.ogg' \) \
    -size +10M 2>/dev/null | head -10)
if [ -n "$LARGE_VIDS" ]; then
    printf '  FAIL: videos over 10MB found\n'
    printf '%s\n' "$LARGE_VIDS"
    ERRORS=$((ERRORS + 1))
else
    VID_COUNT=$(find assets -type f \( -name '*.mp4' -o -name '*.webm' -o -name '*.ogg' \) 2>/dev/null | wc -l | tr -d ' ')
    printf '  OK: no videos over 10MB (%d videos checked)\n' "$VID_COUNT"
fi

# 3. CSS files over 50KB
printf '\n%s\n' '--- CSS files (max 50KB) ---'
LARGE_CSS=""
for f in $(find assets/css -name '*.css' -type f 2>/dev/null); do
    SIZE=$(wc -c < "$f" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 51200 ] 2>/dev/null; then
        KB=$((SIZE / 1024))
        LARGE_CSS="$LARGE_CSS  $f: ${KB}KB\n"
    fi
done
if [ -n "$LARGE_CSS" ]; then
    printf '  FAIL: CSS files over 50KB found\n'
    printf '%b' "$LARGE_CSS"
    ERRORS=$((ERRORS + 1))
else
    CSS_COUNT=$(find assets/css -name '*.css' -type f 2>/dev/null | wc -l | tr -d ' ')
    printf '  OK: no CSS files over 50KB (%d files checked)\n' "$CSS_COUNT"
fi

# 4. JS files over 50KB
printf '\n%s\n' '--- JS files (max 50KB) ---'
LARGE_JS=""
for f in $(find assets/js -name '*.js' -type f 2>/dev/null); do
    SIZE=$(wc -c < "$f" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 51200 ] 2>/dev/null; then
        KB=$((SIZE / 1024))
        LARGE_JS="$LARGE_JS  $f: ${KB}KB\n"
    fi
done
if [ -n "$LARGE_JS" ]; then
    printf '  FAIL: JS files over 50KB found\n'
    printf '%b' "$LARGE_JS"
    ERRORS=$((ERRORS + 1))
else
    JS_COUNT=$(find assets/js -name '*.js' -type f 2>/dev/null | wc -l | tr -d ' ')
    printf '  OK: no JS files over 50KB (%d files checked)\n' "$JS_COUNT"
fi

# 5. Images should have width and height attributes
printf '\n%s\n' '--- Image dimension attributes ---'
IMG_MISSING_DIMS=$(grep -rhE '<img[^>]+>' pages/ index.html 2>/dev/null \
    | grep -v 'width=' \
    | head -10 || true)
if [ -n "$IMG_MISSING_DIMS" ]; then
    COUNT=$(printf '%s' "$IMG_MISSING_DIMS" | wc -l | tr -d ' ')
    printf '  WARN: %d image(s) missing width attribute\n' "$COUNT"
    printf '%s\n' "$IMG_MISSING_DIMS" | head -3
else
    IMG_COUNT=$(grep -rhE '<img[^>]+>' pages/ index.html 2>/dev/null | wc -l | tr -d ' ')
    printf '  OK: all %d images have width/height attributes\n' "$IMG_COUNT"
fi

# 6. Videos should have poster attribute
printf '\n%s\n' '--- Video poster attribute ---'
VIDS_WITHOUT_POSTER=$(grep -rhE '<video[^>]*>' pages/ index.html 2>/dev/null \
    | grep -v 'poster=' | head -10 || true)
if [ -n "$VIDS_WITHOUT_POSTER" ]; then
    COUNT=$(printf '%s' "$VIDS_WITHOUT_POSTER" | wc -l | tr -d ' ')
    printf '  WARN: %d video(s) missing poster attribute\n' "$COUNT"
else
    VID_COUNT=$(grep -rhE '<video[^>]*>' pages/ index.html 2>/dev/null | wc -l | tr -d ' ')
    if [ "$VID_COUNT" -gt 0 ] 2>/dev/null; then
        printf '  OK: all %d video(s) have poster attribute\n' "$VID_COUNT"
    fi
fi

printf '\n'
if [ "$ERRORS" -gt 0 ] 2>/dev/null; then
    printf '%d error(s) found.\n' "$ERRORS" >&2
    exit 1
fi

printf 'All checks passed.\n'
exit 0
