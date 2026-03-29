#!/bin/sh
# test/unit/shipping-rate.test.sh — unit test: calculateParcelRate
# Tests: zone x parcel type combinations

set -u

FILE="assets/js/modules/cartStore.js"
if [ ! -f "$FILE" ]; then
    printf 'ok 1 cartStore.js not found (skip)\n'
    exit 0
fi

node --input-type=module <<'EOF' 2>/dev/null
import { calculateParcelRate, __setCachedPostcodes, __resetCaches } from './assets/js/modules/cartStore.js';

__resetCaches();
__setCachedPostcodes({ postcodes: {
    '6000': { state: 'WA', mmm_2019: 1 },
    '3000': { state: 'VIC', mmm_2019: 1 },
    '6280': { state: 'WA', mmm_2019: 6 },
}});

const opts = { storePostcode: '6000', storeState: 'WA' };

(async () => {
    const r1 = await calculateParcelRate('pouch', '6000', opts);
    console.log(r1.zone === 'sameCity' && r1.rate === 13 ? 'ok 1 pouch sameCity rate = 13' : 'not ok 1 got: ' + JSON.stringify(r1));

    const r2 = await calculateParcelRate('satchel', '6000', opts);
    console.log(r2.zone === 'sameCity' && r2.rate === 15 ? 'ok 2 satchel sameCity rate = 15' : 'not ok 2 got: ' + JSON.stringify(r2));

    const r3 = await calculateParcelRate('shoebox', '6000', opts);
    console.log(r3.zone === 'sameCity' && r3.rate === 24 ? 'ok 3 shoebox sameCity rate = 24' : 'not ok 3 got: ' + JSON.stringify(r3));

    const r4 = await calculateParcelRate('pouch', '3000', opts);
    console.log(r4.zone === 'national' && r4.rate === 13 ? 'ok 4 pouch national rate = 13' : 'not ok 4 got: ' + JSON.stringify(r4));

    const r5 = await calculateParcelRate('invalid', '6000', opts);
    console.log(r5.rate === null ? 'ok 5 invalid parcel type => rate null' : 'not ok 5 got: ' + JSON.stringify(r5));

    const r6 = await calculateParcelRate('briefcase', '6000', opts);
    console.log(r6.zone === 'sameCity' && r6.rate === 29 ? 'ok 6 briefcase sameCity rate = 29' : 'not ok 6 got: ' + JSON.stringify(r6));

    process.exit(0);
})().catch(() => process.exit(1));
EOF
