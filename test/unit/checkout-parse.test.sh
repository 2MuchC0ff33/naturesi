#!/bin/sh
# test/unit/checkout-parse.test.sh — unit test: checkout.js parseCartRaw
# Tests: legacy array, {cart,shipping} object, null, empty

set -u

FILE="assets/js/modules/checkout.js"
if [ ! -f "$FILE" ]; then
    printf 'ok 1 checkout.js not found (skip)\n'
    exit 0
fi

# Test parseCartRaw via node inline eval
node --input-type=module <<'EOF' 2>/dev/null
import { parseCartRaw } from './assets/js/modules/checkout.js';

// Test 1: null input
const r1 = parseCartRaw(null);
const ok1 = JSON.stringify(r1) === JSON.stringify({ cart: [], shipping: 0 });
console.log(ok1 ? 'ok 1 parseCartRaw(null) => { cart:[], shipping:0 }' : 'not ok 1 parseCartRaw(null)');

// Test 2: legacy array format
const r2 = parseCartRaw([{ id: 'A', title: 'Tea', qty: 2, price: 14.95 }]);
const ok2 = r2.cart.length === 1 && r2.cart[0].id === 'A' && r2.shipping === 0;
console.log(ok2 ? 'ok 2 parseCartRaw(legacy array)' : 'not ok 2 parseCartRaw(legacy array)');

// Test 3: new format with cart + shipping
const r3 = parseCartRaw({ cart: [{ id: 'B', title: 'Coffee', qty: 1, price: 19.95 }], shipping: 13.00 });
const ok3 = r3.cart.length === 1 && r3.shipping === 13.00;
console.log(ok3 ? 'ok 3 parseCartRaw({cart,shipping})' : 'not ok 3 parseCartRaw({cart,shipping})');

// Test 4: empty string
const r4 = parseCartRaw('');
const ok4 = JSON.stringify(r4) === JSON.stringify({ cart: [], shipping: 0 });
console.log(ok4 ? 'ok 4 parseCartRaw("") => empty' : 'not ok 4 parseCartRaw("")');

// Test 5: invalid JSON
const r5 = parseCartRaw('not valid json');
const ok5 = JSON.stringify(r5) === JSON.stringify({ cart: [], shipping: 0 });
console.log(ok5 ? 'ok 5 parseCartRaw(invalid) => empty' : 'not ok 5 parseCartRaw(invalid)');

process.exit(ok1 && ok2 && ok3 && ok4 && ok5 ? 0 : 1);
EOF

RESULT=$?
if [ $RESULT -eq 0 ]; then
    exit 0
else
    exit 1
fi
