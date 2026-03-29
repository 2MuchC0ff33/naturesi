#!/bin/sh
# test/unit/checkout-render.test.sh — unit test: renderSummaryToString
# Tests: empty cart, cart with items, shipping included

set -u

FILE="assets/js/modules/checkout.js"
if [ ! -f "$FILE" ]; then
    printf 'ok 1 checkout.js not found (skip)\n'
    exit 0
fi

node --input-type=module <<'EOF' 2>/dev/null
import { renderSummaryToString } from './assets/js/modules/checkout.js';

// Test 1: empty cart
const r1 = renderSummaryToString([]);
console.log(r1.html.includes('empty') ? 'ok 1 empty cart renders message' : 'not ok 1');
console.log(r1.total === 0 ? 'ok 2 empty cart total = 0' : 'not ok 2');

// Test 2: cart with items
const r2 = renderSummaryToString([
    { title: 'Earl Grey', qty: 2, price: 14.95 }
], 13.00);
console.log(r2.html.includes('Earl Grey') ? 'ok 3 renders item title' : 'not ok 3');
console.log(r2.html.includes('checkout-line-items') ? 'ok 4 renders line items' : 'not ok 4');
console.log(r2.html.includes('grand-total') ? 'ok 5 renders grand total' : 'not ok 5');
console.log(Math.abs(r2.total - 42.90) < 0.01 ? 'ok 6 total = 14.95*2 + 13 = 42.90' : 'not ok 6 total=' + r2.total);

// Test 3: null shipping
const r3 = renderSummaryToString([{ title: 'Green Tea', qty: 1, price: 12.50 }], null);
console.log(Math.abs(r3.total - 12.50) < 0.01 ? 'ok 7 null shipping = 0' : 'not ok 7');

process.exit(0);
EOF
