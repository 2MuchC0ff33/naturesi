import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseWeightString,
  calculateParcelRate,
  calculateShippingByWeight,
  getPostcodeZone,
  __setCachedPostcodes,
  __setCachedPostage,
  __resetCaches,
} from '../../assets/js/modules/cartStore.js';

const SAMPLE_POSTCODES = {
  postcodes: {
    '6000': { state: 'WA', mmm_2019: 1, region: 'R1' },
    '6010': { state: 'WA', mmm_2019: 3, region: 'R2' },
    '9999': { state: 'NT', mmm_2019: 6, region: 'R6' },
  },
};
const SAMPLE_POSTAGE = {
  baseRates: {
    pouch: { sameCity: 5, nearMetro: 6, outerPerth: 7, national: 10 },
    satchel: { sameCity: 6, nearMetro: 7, outerPerth: 8, national: 12 },
  },
  remoteSurcharge: { pouch: 5, satchel: 6 },
  remoteWaNtExtra: { pouch: 2, satchel: 3 },
  regionalSurcharge: { pouch: 3, satchel: 4 },
  overLengthSurcharge: 4,
};

describe('Shipping helpers', () => {
  beforeEach(() => {
    __resetCaches();
    __setCachedPostcodes(SAMPLE_POSTCODES);
    __setCachedPostage(SAMPLE_POSTAGE);
  });

  it('parseWeightString handles kg and g', () => {
    expect(parseWeightString('1.5kg')).toBe(1500);
    expect(parseWeightString('250g')).toBe(250);
    expect(parseWeightString(null)).toBe(0);
  });

  it('getPostcodeZone returns sameCity for same postcode', async () => {
    const zone = await getPostcodeZone('6000', { storePostcode: '6000', storeState: 'WA' });
    expect(zone).toBe('sameCity');
  });

  it('calculateParcelRate returns rate and zone', async () => {
    const res = await calculateParcelRate('pouch', '6000', { storeState: 'WA' });
    expect(res.zone).toBeDefined();
    expect(res.rate).toBeGreaterThanOrEqual(0);
  });

  it('calculateShippingByWeight returns parcelType and totalRate for remote postcodes', async () => {
    const res = await calculateShippingByWeight(300, '9999', { storeState: 'WA' });
    expect(res.parcelType).toBeDefined();
    // For NT '9999' with mmm>=5 remote surcharge should be applied so totalRate not null
    expect(res.totalRate).not.toBeNull();
  });
});
