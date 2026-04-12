h37841
s 00052/00000/00000
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
# test/unit/shipping-zone-wa.test.sh — unit test: getPostcodeZone for WA postcodes
# Tests: sameCity, nearMetro, outerPerth, national

set -u

FILE="assets/js/modules/cartStore.js"
if [ ! -f "$FILE" ]; then
    printf 'ok 1 cartStore.js not found (skip)\n'
    exit 0
fi

node --input-type=module <<'EOF' 2>/dev/null
import { getPostcodeZone, __setCachedPostcodes, __resetCaches } from './assets/js/modules/cartStore.js';

// WA postcodes from australian_postcodes.json
const WA_POSTCODES = {
    '6000': { state: 'WA', mmm_2019: 1, region: 'R1' },  // Perth CBD - sameCity
    '6008': { state: 'WA', mmm_2019: 2, region: 'R1' },  // Subiaco - nearMetro
    '6011': { state: 'WA', mmm_2019: 3 },  // Cottesloe - nearMetro
    '6164': { state: 'WA', mmm_2019: 4 },  // Jandakot - outerPerth
    '6280': { state: 'WA', mmm_2019: 5 },  // Bunbury - outerPerth (mmm>=4 in same state)
};

// Inject test data
__resetCaches();
__setCachedPostcodes({ postcodes: WA_POSTCODES });

const opts = { storePostcode: '6000', storeState: 'WA' };

(async () => {
    const z1 = await getPostcodeZone('6000', opts);
    console.log(z1 === 'sameCity' ? 'ok 1 Perth CBD => sameCity' : 'not ok 1 got: ' + z1);

    const z2 = await getPostcodeZone('6008', opts);
    console.log(z2 === 'nearMetro' ? 'ok 2 Subiaco => nearMetro' : 'not ok 2 got: ' + z2);

    const z3 = await getPostcodeZone('6011', opts);
    console.log(z3 === 'nearMetro' ? 'ok 3 Cottesloe => nearMetro (mmm=3)' : 'not ok 3 got: ' + z3);

    const z4 = await getPostcodeZone('6164', opts);
    console.log(z4 === 'outerPerth' ? 'ok 4 Jandakot => outerPerth (mmm=4)' : 'not ok 4 got: ' + z4);

    const z5 = await getPostcodeZone('6280', opts);
    console.log(z5 === 'outerPerth' ? 'ok 5 Bunbury => outerPerth (mmm>=4, same state)' : 'not ok 5 got: ' + z5);

    const z6 = await getPostcodeZone('3000', opts);
    console.log(z6 === 'national' ? 'ok 6 Melbourne => national (different state)' : 'not ok 6 got: ' + z6);

    process.exit(0);
})().catch(() => process.exit(1));
EOF
E 1
