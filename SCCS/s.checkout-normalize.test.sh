h29316
s 00045/00000/00000
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
# test/unit/checkout-normalize.test.sh — unit test: normalizeCartItem
# Tests: valid item, missing id, missing title, zero qty, string price

set -u

FILE="assets/js/modules/checkout.js"
if [ ! -f "$FILE" ]; then
    printf 'ok 1 checkout.js not found (skip)\n'
    exit 0
fi

node --input-type=module <<'EOF' 2>/dev/null
import { normalizeCartItem } from './assets/js/modules/checkout.js';

// Test 1: valid item
const r1 = normalizeCartItem({ id: 'PROD-001', title: 'Earl Grey', price: 14.95, qty: 2 });
console.log(r1 && r1.id === 'PROD-001' ? 'ok 1 valid item normalized' : 'not ok 1');

// Test 2: missing id => undefined
const r2 = normalizeCartItem({ title: 'Tea', price: 10 });
console.log(r2 === undefined ? 'ok 2 missing id => undefined' : 'not ok 2 got: ' + JSON.stringify(r2));

// Test 3: missing title => undefined
const r3 = normalizeCartItem({ id: 'X', price: 10 });
console.log(r3 === undefined ? 'ok 3 missing title => undefined' : 'not ok 3 got: ' + JSON.stringify(r3));

// Test 4: zero qty => undefined
const r4 = normalizeCartItem({ id: 'X', title: 'Y', qty: 0, price: 10 });
console.log(r4 === undefined ? 'ok 4 zero qty => undefined' : 'not ok 4 got: ' + JSON.stringify(r4));

// Test 5: string price
const r5 = normalizeCartItem({ id: 'X', title: 'Y', qty: 1, price: '14.95' });
console.log(r5 && r5.price === 14.95 ? 'ok 5 string price parsed' : 'not ok 5 got: ' + JSON.stringify(r5));

// Test 6: sku as id alias
const r6 = normalizeCartItem({ sku: 'SKU-123', title: 'Green Tea', price: 12, qty: 1 });
console.log(r6 && r6.id === 'SKU-123' ? 'ok 6 sku alias for id' : 'not ok 6 got: ' + JSON.stringify(r6));

// Test 7: name as title alias
const r7 = normalizeCartItem({ id: 'X', name: 'Oolong', price: 15, qty: 1 });
console.log(r7 && r7.title === 'Oolong' ? 'ok 7 name alias for title' : 'not ok 7 got: ' + JSON.stringify(r7));

process.exit(0);
EOF
E 1
