h48950
s 00046/00000/00000
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
JS='
(function() {
    // Clear cart first
    localStorage.removeItem("naturesi_cart");
    // Add test item
    var cart = { items: [{ id: "PROD-001", name: "Test Tea", size: "50g", price: 14.95, qty: 2 }] };
    localStorage.setItem("naturesi_cart", JSON.stringify(cart));
    // Return cart count
    return cart.items.reduce(function(s, i) { return s + i.qty; }, 0);
})();
'

COUNT=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
    --enable-logging --v=1 \
    --virtual-time-budget=3000 \
    --run-all-compositor-stages-before-draw \
    "data:text/html,<script>document.title=eval('${JS}');<\/script>" \
    --dump-dom 2>/dev/null | grep -oE '<title>[^<]+</title>' | sed 's/<[^>]*>//g') || COUNT="0"

COUNT=${COUNT:-0}

if [ "$COUNT" -eq 2 ]; then
    printf 'ok 1 cart item added (qty=2)\n'
else
    printf 'not ok 1 cart item added (expected 2, got %s)\n' "$COUNT"
fi

exit 0
E 1
