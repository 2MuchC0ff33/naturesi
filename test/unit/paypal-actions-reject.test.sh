#!/bin/sh
# test/unit/paypal-actions-reject.test.sh
# Purpose: Ensure actions.reject() is NOT used in createOrder (PayPal SDK bug)
# PayPal SDK only provides actions.reject() in onClick, NOT in createOrder
# Usage: test/unit/paypal-actions-reject.test.sh

CHECKOUT="assets/js/modules/checkout.js"

if [ ! -f "$CHECKOUT" ]; then
  echo "SKIP: $CHECKOUT not found"
  exit 0
fi

FAIL=0
TOTAL=0

# Test 1: No actions.reject() in createOrder block
TOTAL=$((TOTAL + 1))
# Extract content between createOrder: and the next callback (onApprove|onCancel|onError)
IN_CREATE_ORDER=$(awk '
  /createOrder:/ { found=1 }
  found { print }
  /onApprove:|onCancel:|onError:/ { if(found) exit }
' "$CHECKOUT")

if printf '%s\n' "$IN_CREATE_ORDER" | grep -q 'actions\.reject()'; then
  echo "not ok $TOTAL - createOrder must NOT use actions.reject() (use Promise.reject)"
  FAIL=$((FAIL + 1))
else
  echo "ok $TOTAL - createOrder does not use actions.reject()"
fi

# Test 2: actions.reject() IS allowed in onClick (it's valid there)
TOTAL=$((TOTAL + 1))
IN_ON_CLICK=$(awk '
  /onClick:/ { found=1 }
  found { print }
  /createOrder:|onApprove:|onCancel:|onError:/ { if(found) exit }
' "$CHECKOUT")

if printf '%s\n' "$IN_ON_CLICK" | grep -q 'actions\.reject()'; then
  echo "ok $TOTAL - onClick correctly uses actions.reject() (allowed)"
else
  echo "ok $TOTAL - onClick does not use actions.reject() (also OK)"
fi

# Test 3: No actions.reject() in onApprove block
TOTAL=$((TOTAL + 1))
IN_ON_APPROVE=$(awk '
  /onApprove:/ { found=1 }
  found { print }
  /onCancel:|onError:/ { if(found) exit }
' "$CHECKOUT")

if printf '%s\n' "$IN_ON_APPROVE" | grep -q 'actions\.reject()'; then
  echo "not ok $TOTAL - onApprove must NOT use actions.reject()"
  FAIL=$((FAIL + 1))
else
  echo "ok $TOTAL - onApprove does not use actions.reject()"
fi

printf "\n1..%d\n" "$TOTAL"
if [ "$FAIL" -gt 0 ]; then
  echo "FAIL: $FAIL test(s) failed"
  exit 1
fi
exit 0
