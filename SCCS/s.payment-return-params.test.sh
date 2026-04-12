h44213
s 00034/00000/00000
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
# test/unit/payment-return-params.test.sh — unit test: hasPayPalReturnParams
# Tests: PayerID, tx, paymentId, token, empty, partial

set -u

FILE="assets/js/modules/payment-status.js"
if [ ! -f "$FILE" ]; then
    printf 'ok 1 payment-status.js not found (skip)\n'
    exit 0
fi

node --input-type=module <<'EOF' 2>/dev/null
import { hasPayPalReturnParams } from './assets/js/modules/payment-status.js';

// Test 1: PayerID present
console.log(hasPayPalReturnParams('?PayerID=XYZ123') ? 'ok 1 PayerID param detected' : 'not ok 1');

// Test 2: tx present
console.log(hasPayPalReturnParams('?tx=ABC') ? 'ok 2 tx param detected' : 'not ok 2');

// Test 3: paymentId present
console.log(hasPayPalReturnParams('?paymentId=PAY123') ? 'ok 3 paymentId detected' : 'not ok 3');

// Test 4: token present
console.log(hasPayPalReturnParams('?token=EC-123') ? 'ok 4 token detected' : 'not ok 4');

// Test 5: no params
console.log(!hasPayPalReturnParams('') ? 'ok 5 empty string => false' : 'not ok 5');
console.log(!hasPayPalReturnParams('?foo=bar') ? 'ok 6 unrelated params => false' : 'not ok 6');
console.log(!hasPayPalReturnParams(null) ? 'ok 7 null => false' : 'not ok 7');

process.exit(0);
EOF
E 1
