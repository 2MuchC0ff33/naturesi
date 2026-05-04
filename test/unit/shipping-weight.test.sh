#!/bin/sh
# test/unit/shipping-weight.test.sh — unit test: calculateShippingByWeight
# Tests: weight-based parcel selection and zone calculations

set -u

FILE="assets/js/modules/cartStore.js"
if [ ! -f "$FILE" ]; then
    printf 'ok 1 cartStore.js not found (skip)\n'
    exit 0
fi

node --input-type=module <<'EOF' 2>/dev/null
import { calculateShippingByWeight, __resetCaches } from './assets/js/modules/cartStore.js';

__resetCaches();

const opts = { storePostcode: '6147', storeState: 'WA' };

(async () => {
    // Test 1: Pouch (0-250g) to same city
    const r1 = await calculateShippingByWeight(150, '6147', opts);
    console.log(r1 && r1.rate === 13 && r1.parcelType === 'pouch' && r1.zone === 'sameCity' 
        ? 'ok 1 150g -> pouch, sameCity, $13' 
        : 'not ok 1 got: ' + JSON.stringify(r1));

    // Test 2: Satchel (251-500g) to same city
    const r2 = await calculateShippingByWeight(400, '6147', opts);
    console.log(r2 && r2.rate === 15 && r2.parcelType === 'satchel' && r2.zone === 'sameCity'
        ? 'ok 2 400g -> satchel, sameCity, $15'
        : 'not ok 2 got: ' + JSON.stringify(r2));

    // Test 3: Handbag (501-1000g) to near metro
    const r3 = await calculateShippingByWeight(800, '3000', opts);
    console.log(r3 && r3.rate === 19 && r3.parcelType === 'handbag' && r3.zone === 'nearMetro'
        ? 'ok 3 800g -> handbag, nearMetro, $19'
        : 'not ok 3 got: ' + JSON.stringify(r3));

    // Test 4: Shoebox (1001-3000g) to outer Perth
    const r4 = await calculateShippingByWeight(2500, '6200', opts);
    console.log(r4 && r4.rate === 24 && r4.parcelType === 'shoebox' && r4.zone === 'outerPerth'
        ? 'ok 4 2500g -> shoebox, outerPerth, $24'
        : 'not ok 4 got: ' + JSON.stringify(r4));

    // Test 5: Briefcase (3001-5000g) to national
    const r5 = await calculateShippingByWeight(4500, '2000', opts);
    console.log(r5 && r5.rate === 29 && r5.parcelType === 'briefcase' && r5.zone === 'national'
        ? 'ok 5 4500g -> briefcase, national, $29'
        : 'not ok 5 got: ' + JSON.stringify(r5));

    // Test 6: Carryon (5001-10000g) - NEW heavy parcel
    const r6 = await calculateShippingByWeight(8000, '6147', opts);
    console.log(r6 && r6.rate === 35 && r6.parcelType === 'carryon' && r6.zone === 'sameCity'
        ? 'ok 6 8kg -> carryon, sameCity, $35'
        : 'not ok 6 got: ' + JSON.stringify(r6));

    // Test 7: Duffel (10001-20000g) - NEW heavy parcel
    const r7 = await calculateShippingByWeight(15000, '6147', opts);
    console.log(r7 && r7.rate === 55 && r7.parcelType === 'duffle' && r7.zone === 'sameCity'
        ? 'ok 7 15kg -> duffle, sameCity, $55'
        : 'not ok 7 got: ' + JSON.stringify(r7));

    // Test 8: Checkin (20001-25000g) - NEW heavy parcel
    const r8 = await calculateShippingByWeight(22000, '6147', opts);
    console.log(r8 && r8.rate === 75 && r8.parcelType === 'checkin' && r8.zone === 'sameCity'
        ? 'ok 8 22kg -> checkin, sameCity, $75'
        : 'not ok 8 got: ' + JSON.stringify(r8));

    // Test 9: Zero weight defaults to pouch
    const r9 = await calculateShippingByWeight(0, '6147', opts);
    console.log(r9 && r9.parcelType === 'pouch' && r9.rate === 13
        ? 'ok 9 0g defaults to pouch, $13'
        : 'not ok 9 got: ' + JSON.stringify(r9));

    process.exit(0);
})().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
EOF