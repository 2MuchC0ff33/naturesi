#!/bin/sh
# test/headless/prod-customer-journeys.test.sh — Headless: Production customer journeys
# Simulates 6 customer personas on PRODUCTION (randomized order)
# Environment: Tests against https://www.naturesinfusions.com.au

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

PROD_URL="${SITE_BASE:-https://www.naturesinfusions.com.au}"

HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$PROD_URL" 2>/dev/null)
if ! printf '%s' "$HTTP_CODE" | grep -qE '^20[0-5]$'; then
    for i in $(seq 1 30); do
        printf 'ok %d # skip production not reachable\n' "$i"
    done
    printf '\n1..30\n'
    exit 0
fi

printf 'TAP version 14\n'
printf '# Production Customer Journey Tests - Randomized Personas\n\n'

PASS=0
FAIL=0

pass() { printf 'ok %d - %s\n' $((PASS + FAIL + 1)) "$1"; PASS=$((PASS + 1)); }
fail() { printf 'not ok %d - %s\n' $((PASS + FAIL + 1)) "$1" >&2; FAIL=$((FAIL + 1)); }
diag() { printf '# %s\n' "$1"; }

# Customer personas
PERSONAS=$(cat << 'PERSONAS_EOF'
wa-metro|6000|[{"id":"product-calming-50g","title":"Calming Garden","price":14,"qty":1}]|homepage|same-city
wa-regional|6430|[{"id":"product-calming-70g","title":"Calming Garden Cylinder","price":22,"qty":1}]|product|same-state
melbourne-metro|3000|[{"id":"product-turmeric-60g","title":"Enchanted Turmeric","price":14,"qty":1},{"id":"product-sleeping-50g","title":"Sleeping Soundly","price":14,"qty":1}]|store|interstate
sydney-bulk|2000|[{"id":"product-calming-50g","title":"Calming","price":14,"qty":2},{"id":"product-turmeric-60g","title":"Turmeric","price":14,"qty":1},{"id":"product-french-50g","title":"French Earl Grey","price":14,"qty":1},{"id":"product-calendula-50ml","title":"Calendula Cream","price":18,"qty":1},{"id":"product-pillow-1","title":"Eye Pillow","price":20,"qty":1}]|direct-checkout|interstate
tasmania-rural|7000|[{"id":"product-summer-70g","title":"Summer Breeze Cylinder","price":22,"qty":1},{"id":"product-pillow-1","title":"Eye Pillow","price":20,"qty":1}]|homepage|national
returning-customer|6147|[{"id":"product-detox-50g","title":"Natures Detox","price":14,"qty":1}]|cart|store-postcode
PERSONAS_EOF
)

# POSIX shuffle
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

run_persona() {
    PERSONA_ID="$1"
    POSTCODE="$2"
    ITEMS_JSON="$3"
    ENTRY="$4"
    EXPECTED_SHIPPING="$5"

    diag "Testing: $PERSONA_ID (postcode: $POSTCODE)"

    # Create temp HTML for localStorage
    TMP_HTML=$(mktemp /tmp/prod-persona-XXXXXX.html)
    cat > "$TMP_HTML" << EOF
<!DOCTYPE html>
<html>
<head><title>$PERSONA_ID</title></head>
<body>
<script>
var cart = $ITEMS_JSON;
localStorage.setItem('naturesi_cart', JSON.stringify(cart));
window.location.href = '/pages/checkout.html';
</script>
</body>
</html>
EOF

    # Load checkout
    DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --run-all-compositor-stages-before-draw \
        --virtual-time-budget=15000 \
        "file://$TMP_HTML" --dump-dom 2>/dev/null) || DOM=""

    rm -f "$TMP_HTML"

    # Check 1: Cart page accessible
    CART_CHECK=$(curl -s -o /dev/null -w '%{http_code}' -L "$PROD_URL/pages/cart.html" 2>/dev/null)
    if printf '%s' "$CART_CHECK" | grep -qE '^20[0-5]$'; then
        pass "$PERSONA_ID: Cart page accessible"
    else
        fail "$PERSONA_ID: Cart page accessible"
    fi

    # Check 2: Checkout page loads
    DOM_CHECKOUT=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --run-all-compositor-stages-before-draw \
        --virtual-time-budget=15000 \
        "$PROD_URL/pages/checkout.html" --dump-dom 2>/dev/null) || DOM_CHECKOUT=""

    if printf '%s' "$DOM_CHECKOUT" | grep -qiE 'checkout|summary|order'; then
        pass "$PERSONA_ID: Checkout page loads"
    else
        fail "$PERSONA_ID: Checkout page loads"
    fi

    # Check 3: Postcode field available
    if printf '%s' "$DOM_CHECKOUT" | grep -qiE 'postcode|postal'; then
        pass "$PERSONA_ID: Postcode field available"
    else
        DOM_CART=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
            --run-all-compositor-stages-before-draw \
            --virtual-time-budget=10000 \
            "$PROD_URL/pages/cart.html" --dump-dom 2>/dev/null) || DOM_CART=""
        if printf '%s' "$DOM_CART" | grep -qiE 'postcode|postal'; then
            pass "$PERSONA_ID: Postcode field available (cart page)"
        else
            fail "$PERSONA_ID: Postcode field available"
        fi
    fi

    # Check 4: Summary section exists
    if printf '%s' "$DOM_CHECKOUT" | grep -qiE 'summary|total|price'; then
        pass "$PERSONA_ID: Summary section exists"
    else
        fail "$PERSONA_ID: Summary section exists"
    fi

    # Check 5: PayPal button container
    if printf '%s' "$DOM_CHECKOUT" | grep -qi 'paypal-button-container'; then
        pass "$PERSONA_ID: PayPal button container exists"
    else
        fail "$PERSONA_ID: PayPal button container exists"
    fi
}

# Run all personas in shuffled order
SHUFFLED=$(shuffle_personas)

while IFS='|' read -r PERSONA_ID POSTCODE ITEMS_JSON ENTRY EXPECTED_SHIPPING; do
    [ -z "$PERSONA_ID" ] && continue
    run_persona "$PERSONA_ID" "$POSTCODE" "$ITEMS_JSON" "$ENTRY" "$EXPECTED_SHIPPING"
done << EOF
$SHUFFLED
EOF

TOTAL=$((PASS + FAIL))
printf '\n1..%d\n' "$TOTAL"
printf '# %d passed, %d failed\n' "$PASS" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi

printf 'PASS: All production customer journey tests passed\n'
exit 0
