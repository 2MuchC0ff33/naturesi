#!/usr/bin/env yash
# test/unit/cart-store.test.sh — unit test: cartStore.js module structure and consistency
# Checks: CartStore class, exported functions, cart key naming, data file references

set -u

FILE="assets/js/modules/cartStore.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check CartStore class is exported
if grep -q 'export class CartStore' "$FILE"; then
    printf 'ok 2 CartStore class is exported\n'
else
    printf 'not ok 2 CartStore class not exported\n'
    FAIL=$((FAIL + 1))
fi

# Check cart key default is consistent with other modules
if grep -q "naturesi_cart" "$FILE"; then
    printf 'ok 3 cart key "naturesi_cart" is used\n'
else
    printf 'not ok 3 cart key naming inconsistency\n'
    FAIL=$((FAIL + 1))
fi

# Check postcode zone function exists
if grep -q 'export async function getPostcodeZone' "$FILE"; then
    printf 'ok 4 getPostcodeZone function exported\n'
else
    printf 'not ok 4 getPostcodeZone not exported\n'
    FAIL=$((FAIL + 1))
fi

# Check shipping calculation function
if grep -q 'export async function calculateShippingByWeight' "$FILE"; then
    printf 'ok 5 calculateShippingByWeight function exported\n'
else
    printf 'not ok 5 calculateShippingByWeight not exported\n'
    FAIL=$((FAIL + 1))
fi

# Check StoreProxy default export
if grep -q 'export default StoreProxy' "$FILE"; then
    printf 'ok 6 StoreProxy default export present\n'
else
    printf 'not ok 6 StoreProxy default export missing\n'
    FAIL=$((FAIL + 1))
fi

# Check testing hooks are present
if grep -q '__setCachedPostcodes' "$FILE" && grep -q '__setCachedPostage' "$FILE"; then
    printf 'ok 7 testing hooks present\n'
else
    printf 'not ok 7 testing hooks missing\n'
    FAIL=$((FAIL + 1))
fi

# Check referenced JSON data files exist
for json in 'australian_postcodes.json' 'postage.json'; do
    if [ -f "assets/js/data/$json" ]; then
        printf 'ok 8 %s exists\n' "$json"
    else
        printf 'not ok 8 %s missing\n' "$json"
        FAIL=$((FAIL + 1))
    fi
done

printf 'ok 9 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
