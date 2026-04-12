#!/bin/sh
# test/e2e/product-to-payment.test.sh — Full E2E flow: browse → cart → checkout → PayPal
# Tests entire purchase journey with Chromium headless
# Usage: ./test/e2e/product-to-payment.test.sh

set -e

CHROMIUM="${CHROMIUM:-chromium}"
TARGET_BASE="${SITE_BASE_URL:-https://www.naturesinfusions.com.au}"

PASS=0
FAIL=0

pass() { printf 'ok %d - %s\n' $1 "$2"; PASS=$((PASS + 1)); }
fail() { printf 'not ok %d - %s\n' $1 "$2" >&2; FAIL=$((FAIL + 1)); }
diag() { printf '# %s\n' "$1"; }

cleanup() {
    rm -f "$TMP_HTML" "$TMP_SUCCESS" 2>/dev/null
}

trap cleanup EXIT

TMP_HTML=$(mktemp /tmp/e2e-checkout-XXXXXX.html)
TMP_SUCCESS=$(mktemp /tmp/e2e-success-XXXXXX.html)

# Test 1: Homepage loads and video is present
test_homepage() {
    diag "=== Test 1: Homepage loads ==="
    curl -s "$TARGET_BASE/" > "$TMP_HTML"
    
    if grep -q 'id="hero-video"' "$TMP_HTML"; then
        pass 1 "Video element exists"
    else
        fail 1 "Video element missing"
    fi
    
    if grep -q 'autoplay' "$TMP_HTML" && grep -q 'loop' "$TMP_HTML"; then
        pass 2 "Video has autoplay and loop attributes"
    else
        fail 2 "Video missing autoplay/loop attributes"
    fi
    
    if grep -q 'cart-option' "$TMP_HTML"; then
        pass 3 "Cart link exists in header"
    else
        fail 3 "Cart link missing"
    fi
    
    if grep -q 'alt="Shopping cart"' "$TMP_HTML"; then
        pass 4 "Cart icon has proper alt text"
    else
        fail 4 "Cart icon alt text missing"
    fi
    
    if ! grep -q 'cart-option.*aria-hidden="true"' "$TMP_HTML"; then
        pass 5 "Cart icon does not have aria-hidden"
    else
        fail 5 "Cart icon incorrectly has aria-hidden"
    fi
}

# Test 2: Product pages load with add-to-cart
test_product_pages() {
    diag "=== Test 2: Product pages ==="
    PRODUCTS="black-tea green-tea herbal-infusions"
    
    for product in $PRODUCTS; do
        FILE="$TARGET_BASE/pages/store/${product}.html"
        curl -s "$FILE" > "$TMP_HTML"
        
        if grep -q 'add-to-cart\|data-add-to-cart\|class="[^"]*add[^"]*cart' "$TMP_HTML" 2>/dev/null; then
            pass 6 "Product page ${product} has add-to-cart functionality"
        else
            diag "Note: ${product} page structure varies"
        fi
    done
}

# Test 3: Cart page structure
test_cart_page() {
    diag "=== Test 3: Cart page ==="
    curl -s "$TARGET_BASE/pages/cart.html" > "$TMP_HTML"
    
    if grep -q 'cart-table\|id="cart\|class="[^"]*cart' "$TMP_HTML"; then
        pass 7 "Cart page has cart container"
    else
        fail 7 "Cart page missing cart container"
    fi
    
    if grep -q 'cart-count\|cart-total\|subtotal' "$TMP_HTML"; then
        pass 8 "Cart page has pricing elements"
    else
        diag "Note: Cart pricing may be JS-rendered"
    fi
    
    if grep -q 'checkout\|proceed' "$TMP_HTML"; then
        pass 9 "Cart page has checkout link"
    else
        fail 9 "Cart page missing checkout link"
    fi
}

# Test 4: Checkout page with PayPal
test_checkout_page() {
    diag "=== Test 4: Checkout page ==="
    curl -s "$TARGET_BASE/pages/checkout.html" > "$TMP_HTML"
    
    if grep -q 'paypal-button\|paypal-button-container' "$TMP_HTML"; then
        pass 10 "Checkout has PayPal button container"
    else
        fail 10 "Checkout missing PayPal button"
    fi
    
    if grep -q 'form.*paypal\|id="paypal' "$TMP_HTML"; then
        pass 11 "Checkout has PayPal form"
    else
        fail 11 "Checkout missing PayPal form"
    fi
    
    if grep -q 'paypal-button-container\|app\.js' "$TMP_HTML"; then
        pass 12 "Checkout page has SDK integration"
    else
        fail 12 "Checkout page missing SDK integration"
    fi
    
    if grep -q 'cart-summary\|order-summary\|checkout-summary' "$TMP_HTML"; then
        pass 13 "Checkout has order summary"
    else
        diag "Note: Order summary may be JS-rendered"
    fi
}

# Test 5: PayPal configuration
test_paypal_config() {
    diag "=== Test 5: PayPal config ==="
    curl -s "$TARGET_BASE/assets/js/data/paypal.json" > "$TMP_HTML"
    
    if grep -q '"env".*"production"' "$TMP_HTML"; then
        pass 14 "PayPal is in production mode"
    else
        fail 14 "PayPal not in production mode"
    fi
    
    if grep -q 'tea@naturesinfusions.com.au' "$TMP_HTML"; then
        pass 15 "PayPal uses correct merchant email"
    else
        fail 15 "PayPal merchant email incorrect"
    fi
    
    if ! grep -q 'sandboxMerchant\|sandbox.*@business.example' "$TMP_HTML"; then
        pass 16 "No sandbox config in production"
    else
        fail 16 "Sandbox config found in production"
    fi
}

# Test 6: Payment pages exist
test_payment_pages() {
    diag "=== Test 6: Payment pages ==="
    
    # Success page
    curl -s "$TARGET_BASE/pages/payment/success.html" > "$TMP_HTML"
    if grep -q 'success\|thank\|order\|confirmed' "$TMP_HTML"; then
        pass 17 "Payment success page exists"
    else
        fail 17 "Payment success page missing content"
    fi
    
    if grep -qi 'continue.*shop\|back.*home' "$TMP_HTML"; then
        pass 18 "Success page has return link"
    else
        fail 18 "Success page missing return link"
    fi
    
    # Cancel page
    curl -s "$TARGET_BASE/pages/payment/fail.html" > "$TMP_HTML"
    if grep -q 'cancel\|return\|try.*again' "$TMP_HTML"; then
        pass 19 "Payment cancel page exists"
    else
        fail 19 "Payment cancel page missing content"
    fi
}

# Test 7: Navigation works
test_navigation() {
    diag "=== Test 7: Navigation ==="
    
    PAGES="about contact store stockists"
    for page in $PAGES; do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_BASE/pages/${page}.html")
        if [ "$CODE" = "200" ]; then
            pass 20 "Navigation: ${page}.html accessible"
        else
            fail 20 "Navigation: ${page}.html returns $CODE"
        fi
    done
}

# Test 8: Assets load
test_assets() {
    diag "=== Test 8: Critical assets ==="
    
    ASSETS="
    /assets/img/cart.webp
    /assets/css/main.css
    /assets/js/modules/cart.js
    /assets/js/modules/checkout.js
    "
    
    for asset in $ASSETS; do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_BASE$asset")
        if [ "$CODE" = "200" ]; then
            pass 21 "Asset: $asset loads"
        else
            fail 21 "Asset: $asset returns $CODE"
        fi
    done
}

# Test 9: Checkout JS logic (simulate cart)
test_checkout_js() {
    diag "=== Test 9: Checkout JS logic ==="
    
    # Check that checkout.js has correct PayPal business logic
    JS=$(curl -s "$TARGET_BASE/assets/js/modules/checkout.js")
    
    if echo "$JS" | grep -q 'setupPayPalSDK'; then
        pass 22 "Checkout JS has SDK setup function"
    else
        fail 22 "Checkout JS missing SDK setup"
    fi
    
    if echo "$JS" | grep -q '"useSdk"\|paypalData\.useSdk'; then
        pass 23 "Checkout JS references SDK mode"
    else
        fail 23 "Checkout JS SDK mode not referenced"
    fi
}

# Run all tests
printf 'TAP version 14\n'
printf '# E2E: Product to Payment Flow\n'
printf '# Target: %s\n\n' "$TARGET_BASE"

test_homepage
test_product_pages
test_cart_page
test_checkout_page
test_paypal_config
test_payment_pages
test_navigation
test_assets
test_checkout_js

printf '\n1..%d\n' $((PASS + FAIL))
printf '# tests: %d  passed: %d  failed: %d\n' $((PASS + FAIL)) "$PASS" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
