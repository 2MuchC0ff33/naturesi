#!/bin/sh
# test/unit/checkout-total.test.sh — unit test: computeGrandTotal
# Tests: empty cart, single item, multi-item, zero price, missing price

set -u

FILE="assets/js/modules/checkout.js"
if [ ! -f "$FILE" ]; then
    printf 'ok 1 checkout.js not found (skip)\n'
    exit 0
fi

node --input-type=module <<'EOF' 2>/dev/null
import { computeGrandTotal } from './assets/js/modules/checkout.js';

// Test 1: empty cart
const ok1 = computeGrandTotal([]) === 0;
console.log(ok1 ? 'ok 1 computeGrandTotal([]) === 0' : 'not ok 1 computeGrandTotal([])');

// Test 2: single item
const ok2 = computeGrandTotal([{ price: 14.95, qty: 1 }]) === 14.95;
console.log(ok2 ? 'ok 2 computeGrandTotal single item' : 'not ok 2 computeGrandTotal single item');

// Test 3: multiple items
const ok3 = Math.abs(computeGrandTotal([
    { price: 14.95, qty: 2 },
    { price: 19.95, qty: 1 }
]) - 49.85) < 0.001;
console.log(ok3 ? 'ok 3 computeGrandTotal multi-item (14.95*2 + 19.95 = 49.85)' : 'not ok 3');

// Test 4: missing price treated as 0
const ok4 = computeGrandTotal([{ qty: 2 }]) === 0;
console.log(ok4 ? 'ok 4 computeGrandTotal missing price => 0' : 'not ok 4');

// Test 5: qty as string
const ok5 = computeGrandTotal([{ price: '10.00', qty: '3' }]) === 30;
console.log(ok5 ? 'ok 5 computeGrandTotal string qty/price' : 'not ok 5');

// Test 6: null price
const ok6 = computeGrandTotal([{ price: null, qty: 1 }]) === 0;
console.log(ok6 ? 'ok 6 computeGrandTotal null price => 0' : 'not ok 6');

process.exit(ok1 && ok2 && ok3 && ok4 && ok5 && ok6 ? 0 : 1);
EOF
