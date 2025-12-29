import assert from 'assert';
import { calculateShippingByWeight, calculateParcelRate, getPostcodeZone, __setCachedPostcodes, __setCachedPostage, __resetCaches } from '../assets/js/modules/cartStore.js';

async function run() {
  // Mock postage data (reflecting Sendle Standard example rates)
  const postage = {
    baseRates: {
      pouch: { sameCity: 6.51, nearMetro: 6.84, outerPerth: 8.05, national: 8.05 },
      satchel: { sameCity: 8.28, nearMetro: 8.89, outerPerth: 10.44, national: 10.44 },
      handbag: { sameCity: 11.39, nearMetro: 11.5, outerPerth: 13.77, national: 13.77 },
      shoebox: { sameCity: 13.92, nearMetro: 14.44, outerPerth: 17.33, national: 17.33 },
      briefcase: { sameCity: 14.04, nearMetro: 17.57, outerPerth: 21.27, national: 21.27 },
      carryon: { sameCity: 14.32, nearMetro: 25.29, outerPerth: 30.64, national: 30.64 },
      duffle: { sameCity: 15.86, nearMetro: 34.64, outerPerth: 41.97, national: 41.97 },
      checkin: { sameCity: 18.07, nearMetro: 41.04, outerPerth: 49.75, national: 49.75 }
    },
    regionalSurcharge: { pouch: 3, satchel: 1.5, handbag: 2.5, shoebox: 3.5, briefcase: 5.5, carryon: 7.5, duffle: 10, checkin: 15 },
    remoteSurcharge: { pouch: 8, satchel: 9, handbag: 10, shoebox: 12, briefcase: 14, carryon: 17, duffle: 22, checkin: 25 },
    remoteWaNtExtra: { briefcase: 5, carryon: 10, checkin: 20 },
    overLengthSurcharge: 16.5
  };

  const postcodes = {
    postcodes: {
      '6147': { state: 'WA', mmm_2019: '1' }, // store postcode (same city)
      '2000': { state: 'NSW', mmm_2019: '2' },
      '3000': { state: 'VIC', mmm_2019: '4' },
      '9999': { state: 'WA', mmm_2019: '5' }, // remote WA
      '8888': { state: 'NT', mmm_2019: '5' }  // remote NT
    }
  };

  __setCachedPostage(postage);
  __setCachedPostcodes(postcodes);

  // 1) 250g to sameCity (6147) => pouch
  let res = await calculateShippingByWeight(250, '6147', { storeState: 'WA', storePostcode: '6147' });
  assert.strictEqual(res.parcelType, 'pouch', '250g -> pouch');
  assert.strictEqual(res.zone, 'sameCity');
  assert.strictEqual(Number(res.totalRate).toFixed(2), '6.51');

  // 2) 251g to 2000 (nearMetro) => satchel
  res = await calculateShippingByWeight(251, '2000', { storeState: 'WA', storePostcode: '6147' });
  assert.strictEqual(res.parcelType, 'satchel', '251g should map to satchel');

  // 3) remote postcode 9999 WA with weight 900g -> handbag with remote surcharge + WA extra when applicable
  res = await calculateShippingByWeight(900, '9999', { storeState: 'WA', storePostcode: '6147' });
  assert.strictEqual(res.parcelType, 'handbag', '900g -> handbag');
  assert.ok(res.totalRate > res.baseRate, 'remote surcharge applied for remote WA');

  // 4) remote NT 12000g -> parcel type duffle (20kg) or carryon if within 10kg; check surcharge applied
  res = await calculateShippingByWeight(12000, '8888', { storeState: 'WA', storePostcode: '6147' });
  assert.ok(res.totalRate > res.baseRate, 'NT remote surcharge applied');

  // 5) Over-length surcharge applied when requested
  res = await calculateShippingByWeight(200, '2000', { storeState: 'WA', storePostcode: '6147', overLength: true });
  assert.ok(res.totalRate > res.baseRate, 'over-length surcharge applied');

  console.log('All shipping tests passed');
  __resetCaches();
}

run().catch((err) => {
  console.error('Shipping tests failed', err);
  process.exit(1);
});
