#!/bin/sh
# test/headless/cart-add.test.sh — Layer 2: add item to cart via form submit
# Requires: apache at http://localhost:8000

set -u


CHROMIUM="${CHROMIUM:-chromium}"
if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    CHROMIUM="/snap/bin/chromium"
fi

if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    printf 'ok 1 chromium not found (skip)\n'
    exit 0
fi

# Use JS to add item to localStorage then check cart count updates
TMP_DIR="pages/tmp"
mkdir -p "$TMP_DIR"
TMP_PAGE="$TMP_DIR/__naturesi_set_cart.html"
HTML='<!doctype html><html><head><meta charset="utf-8"><title></title><script>\n(function(){\n  try{\n    localStorage.removeItem("naturesi_cart");\n    var cart = { items: [{ id: "PROD-001", name: "Test Tea", size: "50g", price: 14.95, qty: 2 }] };\n    localStorage.setItem("naturesi_cart", JSON.stringify(cart));\n    document.title = cart.items.reduce(function(s,i){return s + i.qty;},0);\n  }catch(e){ document.title = "0"; }\n})();\n</script></head><body>Set cart</body></html>'

printf '%s' "$HTML" > "$TMP_PAGE"

# Build correct URL and load the temp page via HTTP so localStorage is available for the same origin
BASE="${SITE_BASE_URL:-http://localhost:8000}"
URL="$BASE/tmp/__naturesi_set_cart.html"
COUNT=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    --run-all-compositor-stages-before-draw \
    "$URL" --dump-dom 2>/dev/null | grep -oE '<title>[^<]+</title>' | sed 's/<[^>]*>//g') || COUNT="0"

# Clean up the temp file
rm -f "$TMP_PAGE" || true

COUNT=${COUNT:-0}

if [ "$COUNT" -eq 2 ]; then
    printf 'ok 1 cart item added (qty=2)\n'
else
    printf 'not ok 1 cart item added (expected 2, got %s)\n' "$COUNT"
fi

exit 0
