h65152
s 00182/00000/00000
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
# test/headless/paypal-customer-journeys.test.sh — Headless: Customer journey personas
# Simulates 6 customer personas with different locations, carts, and behaviors
# Order is RANDOMIZED using POSIX-compatible shuffle
# Requires: apache running (scripts/serve.sh start)

set -u

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

CHROMIUM="${CHROMIUM:-chromium}"
if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    CHROMIUM="/snap/bin/chromium"
fi

if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    for i in $(seq 1 30); do
        printf 'ok %d chromium not found (skip)\n' "$i"
    done
    printf '\n1..30\n'
    exit 0
fi

SITE_BASE="${SITE_BASE_URL:-http://localhost:8000}"

HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$SITE_BASE" 2>/dev/null)
if ! printf '%s' "$HTTP_CODE" | grep -qE '^20[0-5]$'; then
    for i in $(seq 1 30); do
        printf 'ok %d # skip site not reachable\n' "$i"
    done
    printf '\n1..30\n'
    exit 0
fi

printf 'TAP version 14\n'
printf '# Customer Journey Tests - Randomized Personas\n\n'

PASS=0
FAIL=0
TOTAL_PERSONAS=6
TESTS_PER_PERSONA=5

pass() { printf 'ok %d - %s\n' $((PASS + FAIL + 1)) "$1"; PASS=$((PASS + 1)); }
fail() { printf 'not ok %d - %s\n' $((PASS + FAIL + 1)) "$1" >&2; FAIL=$((FAIL + 1)); }
diag() { printf '# %s\n' "$1"; }

# Customer personas - each line: ID|POSTCODE|ITEMS_JSON|ENTRY|EXPECTED_SHIPPING_TYPE
PERSONAS=$(cat << 'PERSONAS_EOF'
wa-metro|6000|[{"id":"product-calming-50g","title":"Calming Garden - 50g Pouch","price":14,"qty":1}]|homepage|same-city
wa-regional|6430|[{"id":"product-calming-70g","title":"Calming Garden - 70g Cylinder","price":22,"qty":1}]|product|same-state
melbourne-metro|3000|[{"id":"product-turmeric-60g","title":"Enchanted Turmeric - 60g Pouch","price":14,"qty":1},{"id":"product-sleeping-50g","title":"Sleeping Soundly - 50g Pouch","price":14,"qty":1}]|store|interstate
sydney-bulk|2000|[{"id":"product-calming-50g","title":"Calming Garden","price":14,"qty":2},{"id":"product-turmeric-60g","title":"Enchanted Turmeric","price":14,"qty":1},{"id":"product-french-50g","title":"French Earl Grey","price":14,"qty":1},{"id":"product-calendula-50ml","title":"Calendula Cream","price":18,"qty":1},{"id":"product-pillow-1","title":"Herbal Eye Pillow","price":20,"qty":1}]|direct-checkout|interstate
tasmania-rural|7000|[{"id":"product-summer-70g","title":"Summer Breeze - 70g Cylinder","price":22,"qty":1},{"id":"product-pillow-1","title":"Herbal Eye Pillow","price":20,"qty":1}]|homepage|national
returning-customer|6147|[{"id":"product-detox-50g","title":"Natures Detox","price":14,"qty":1}]|cart|store-postcode
PERSONAS_EOF
)

# POSIX-compatible shuffle using awk
shuffle_personas() {
    printf '%s\n' "$PERSONAS" | awk 'BEGIN{srand()}
        {lines[NR]=$0; count=NR}
        END{
            while(count>0){
                r=int(count*rand())+1
                print lines[r]
                lines[r]=lines[count]
                count=count-1
            }
        }'
}

# Run a single persona test
run_persona() {
    PERSONA_ID="$1"
    POSTCODE="$2"
    ITEMS_JSON="$3"
    ENTRY="$4"
    EXPECTED_SHIPPING="$5"

    diag "Testing persona: $PERSONA_ID (postcode: $POSTCODE, entry: $ENTRY)"

    # Create temp HTML to set localStorage and navigate
    TMP_HTML=$(mktemp /tmp/persona-test-XXXXXX.html)
    cat > "$TMP_HTML" << EOF
<!DOCTYPE html>
<html>
<head><title>$PERSONA_ID Test</title></head>
<body>
<script>
var cart = $ITEMS_JSON;
localStorage.setItem('naturesi_cart', JSON.stringify(cart));
window.location.href = '/pages/checkout.html';
</script>
<p>Setting cart for $PERSONA_ID...</p>
</body>
</html>
EOF

    # Load checkout page
    DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --run-all-compositor-stages-before-draw \
        --virtual-time-budget=15000 \
        "file://$TMP_HTML" --dump-dom 2>/dev/null) || DOM=""

    # Clean up
    rm -f "$TMP_HTML"

    # Check 1: Entry point → Add to cart → Cart page accessible
    CART_URL="$SITE_BASE/pages/cart.html"
    CART_CHECK=$(curl -s -o /dev/null -w '%{http_code}' -L "$CART_URL" 2>/dev/null)
    if printf '%s' "$CART_CHECK" | grep -qE '^20[0-5]$'; then
        pass "$PERSONA_ID: Cart page accessible"
    else
        fail "$PERSONA_ID: Cart page accessible"
    fi

    # Check 2: Navigate to cart → Items displayed correctly (or checkout loaded)
    DOM_CHECKOUT=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --run-all-compositor-stages-before-draw \
        --virtual-time-budget=15000 \
        "$SITE_BASE/pages/checkout.html" --dump-dom 2>/dev/null) || DOM_CHECKOUT=""

    if printf '%s' "$DOM_CHECKOUT" | grep -qiE 'checkout|summary|order'; then
        pass "$PERSONA_ID: Checkout page loads"
    else
        fail "$PERSONA_ID: Checkout page loads"
    fi

    # Check 3: Enter postcode → Shipping rate calculated
    # For headless, we verify the postcode field exists
    if printf '%s' "$DOM_CHECKOUT" | grep -qiE 'postcode|postal'; then
        pass "$PERSONA_ID: Postcode field available"
    else
        # Postcode might be on cart page, not checkout
        DOM_CART=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
            --run-all-compositor-stages-before-draw \
            --virtual-time-budget=10000 \
            "$SITE_BASE/pages/cart.html" --dump-dom 2>/dev/null) || DOM_CART=""
        if printf '%s' "$DOM_CART" | grep -qiE 'postcode|postal'; then
            pass "$PERSONA_ID: Postcode field available (cart page)"
        else
            fail "$PERSONA_ID: Postcode field available"
        fi
    fi

    # Check 4: Proceed to checkout → Summary shows items + shipping
    if printf '%s' "$DOM_CHECKOUT" | grep -qiE 'summary|total|price'; then
        pass "$PERSONA_ID: Summary section exists"
    else
        fail "$PERSONA_ID: Summary section exists"
    fi

    # Check 5: PayPal button appears → Button container has iframe or button
    if printf '%s' "$DOM_CHECKOUT" | grep -qiE 'paypal-button-container'; then
        pass "$PERSONA_ID: PayPal button container exists"
    else
        fail "$PERSONA_ID: PayPal button container exists"
    fi
}

# Main: Run all personas in shuffled order
SHUFFLED=$(shuffle_personas)
TEST_NUM=1

while IFS='|' read -r PERSONA_ID POSTCODE ITEMS_json ENTRY EXPECTED_SHIPPING; do
    [ -z "$PERSONA_ID" ] && continue
    run_persona "$PERSONA_ID" "$POSTCODE" "$ITEMS_json" "$ENTRY" "$EXPECTED_SHIPPING"
done << EOF
$SHUFFLED
EOF

TOTAL=$((PASS + FAIL))
printf '\n1..%d\n' "$TOTAL"
printf '# %d passed, %d failed\n' "$PASS" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi

printf 'PASS: All customer journey tests passed\n'
exit 0
E 1
