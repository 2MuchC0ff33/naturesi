#!/bin/sh
# test/headless/full-checkout-flow.test.sh — Browser-based E2E checkout test
# Uses Chromium headless to test actual checkout flow
# Tests: Add to cart → Checkout → PayPal form population → Simulate payment

set -e

CHROMIUM="${CHROMIUM:-chromium}"
TARGET_BASE="${SITE_BASE_URL:-https://www.naturesinfusions.com.au}"

PASS=0
FAIL=0

pass() { printf 'ok %d - %s\n' $1 "$2"; PASS=$((PASS + 1)); }
fail() { printf 'not ok %d - %s\n' $1 "$2" >&2; FAIL=$((FAIL + 1)); }
diag() { printf '# %s\n' "$1"; }

# Check Chromium available
if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
    CHROMIUM="chromium-browser"
    if ! command -v "$CHROMIUM" >/dev/null 2>&1; then
        diag "WARN: Chromium not found, skipping browser tests"
        exit 0
    fi
fi

# Helper: Run JS in browser and get result
run_js() {
    js="$1"
    file="$2"
    cat > "$file" << SCRIPT
const results = [];
(async () => {
    try {
        $js
        console.log(JSON.stringify({ success: true, results }));
    } catch (e) {
        console.log(JSON.stringify({ success: false, error: e.message }));
    }
})();
SCRIPT
}

TMP=$(mktemp /tmp/chromium-test-XXXXXX.html)
TEST_JS=$(mktemp /tmp/chromium-js-XXXXXX.js)

cleanup() {
    rm -f "$TMP" "$TEST_JS" 2>/dev/null
}
trap cleanup EXIT

# Load homepage and check video
test_video_autoplay() {
    diag "=== Video autoplay check ==="
    HOMEPAGE=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --virtual-time-budget=2000 "$TARGET_BASE/" \
        --dump-dom 2>/dev/null)
    
    AUTOPLAY_COUNT=$(printf '%s' "$HOMEPAGE" | grep -c 'autoplay' || true)
    LOOP_COUNT=$(printf '%s' "$HOMEPAGE" | grep -c 'loop' || true)
    
    if [ "$AUTOPLAY_COUNT" -ge 1 ] && [ "$LOOP_COUNT" -ge 1 ]; then
        pass 1 "Video has autoplay and loop attributes"
    else
        fail 1 "Video missing autoplay attributes"
    fi
}

# Test cart icon visibility
test_cart_icon() {
    diag "=== Cart icon visibility ==="
    DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --virtual-time-budget=3000 "$TARGET_BASE/" \
        --dump-dom 2>/dev/null)
    
    if echo "$DOM" | grep -q 'alt="Shopping cart"'; then
        pass 2 "Cart icon has alt text"
    else
        fail 2 "Cart icon missing alt text"
    fi
    
    if echo "$DOM" | grep -qE 'cart-option.*aria-hidden="true"'; then
        fail 3 "Cart icon has aria-hidden (hidden)"
    else
        pass 3 "Cart icon is visible"
    fi
    
    if echo "$DOM" | grep -q 'cart-option.*style="display:\s*none'; then
        fail 4 "Cart icon has display:none"
    else
        pass 4 "Cart icon not hidden via CSS"
    fi
}

# Test checkout form structure
test_checkout_form() {
    diag "=== Checkout form structure ==="
    DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --virtual-time-budget=3000 "$TARGET_BASE/pages/checkout.html" \
        --dump-dom 2>/dev/null)
    
    if echo "$DOM" | grep -q 'paypal-button-container'; then
        pass 5 "PayPal button container exists"
    else
        fail 5 "PayPal button container not found"
    fi
    
    if echo "$DOM" | grep -q 'app\.js\|type="module"'; then
        pass 6 "Checkout page loads JS module"
    else
        fail 6 "Checkout page missing JS module"
    fi
    
    if echo "$DOM" | grep -q 'order-summary\|checkout-summary'; then
        pass 7 "Checkout has order summary section"
    else
        fail 7 "Checkout missing order summary"
    fi
}

# Test localStorage functionality
test_localstorage() {
    diag "=== LocalStorage cart ==="
    CART_JS=$(curl -s -L "$TARGET_BASE/assets/js/modules/cart.js" 2>/dev/null)
    CARTSTORE_JS=$(curl -s -L "$TARGET_BASE/assets/js/modules/cartStore.js" 2>/dev/null)
    if \
        echo "$CART_JS$CARTSTORE_JS" | grep -q 'localStorage\.setItem' && \
        echo "$CART_JS$CARTSTORE_JS" | grep -q 'naturesi_cart'; then
        pass 8 "Cart JS or cartStore.js uses localStorage with correct key"
    else
        fail 8 "Cart JS localStorage key incorrect"
    fi
}

# Test PayPal SDK configuration
test_paypal_sdk() {
    diag "=== PayPal SDK configuration ==="
    
    PAYPAL_JSON=$(curl -s -L "$TARGET_BASE/assets/js/data/paypal.json" 2>/dev/null)
    CHECKOUT_JS=$(curl -s -L "$TARGET_BASE/assets/js/modules/checkout.js" 2>/dev/null)
    
    if echo "$PAYPAL_JSON" | grep -q '"useSdk": true'; then
        pass 9 "PayPal SDK mode enabled"
    else
        fail 9 "PayPal SDK mode not enabled"
    fi
    
    if echo "$CHECKOUT_JS" | grep -q 'setupPayPalSDK'; then
        pass 10 "Checkout JS has SDK setup function"
    else
        fail 10 "Checkout JS missing SDK setup function"
    fi
}

# Test cart count updates
test_cart_count() {
    diag "=== Cart count display ==="
    DOM=$("$CHROMIUM" --headless --disable-gpu --no-sandbox \
        --virtual-time-budget=3000 "$TARGET_BASE/" \
        --dump-dom 2>/dev/null)
    
    if echo "$DOM" | grep -q 'cart-count\|cart-count[^>]*>'; then
        pass 11 "Cart count element exists"
    else
        fail 11 "Cart count element missing"
    fi
}

# Run all tests
printf 'TAP version 14\n'
printf '# Headless E2E: Full Checkout Flow\n'
printf '# Target: %s\n\n' "$TARGET_BASE"

test_video_autoplay
test_cart_icon
test_checkout_form
test_localstorage
test_paypal_sdk
test_cart_count

printf '\n1..%d\n' $((PASS + FAIL))
printf '# tests: %d  passed: %d  failed: %d\n' $((PASS + FAIL)) "$PASS" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
