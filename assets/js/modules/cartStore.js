const DEFAULT = { items: [] };

function getLocalCart(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setLocalCart(cart, key) {
  try {
    localStorage.setItem(key, JSON.stringify(cart));
    return true;
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
    return false;
  }
}

function loadCartFromIDB(dbName, key) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return resolve(null);
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = (evt) => {
      const db = evt.target.result;
      if (!db.objectStoreNames.contains('cart')) db.createObjectStore('cart');
    };
    req.onsuccess = (evt) => {
      const db = evt.target.result;
      const tx = db.transaction('cart', 'readonly');
      const store = tx.objectStore('cart');
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

function saveCartToIDB(cart, dbName, key) {
  return new Promise((resolve) => {
    if (!('indexedDB' in window)) {
      console.error('IndexedDB is not supported in this browser.');
      return resolve(false);
    }
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = (evt) => {
      const db = evt.target.result;
      if (!db.objectStoreNames.contains('cart')) db.createObjectStore('cart');
    };
    req.onsuccess = (evt) => {
      const db = evt.target.result;
      const tx = db.transaction('cart', 'readwrite');
      const store = tx.objectStore('cart');
      const putReq = store.put(cart, key);
      putReq.onsuccess = () => resolve(true);
      putReq.onerror = (err) => {
        console.error('Error saving cart to IndexedDB:', err);
        resolve(false);
      };
    };
    req.onerror = (err) => {
      console.error('Error opening IndexedDB:', err);
      resolve(false);
    };
  });
}

export class CartStore {
  constructor(opts = {}) {
    this.key = opts.key || 'naturesi_cart';
    this.dbName = opts.dbName || 'naturesi_cart_db';
    this.cart = DEFAULT;
  }

  async init() {
    const local = getLocalCart(this.key);
    if (local) {
      // Accept legacy array shape and normalise to { items: [...] }
      if (Array.isArray(local)) {
        this.cart = {
          items: local.map((it) => ({
            id: it.id,
            name: it.title || it.name || '',
            size: it.size || '',
            quantity: it.qty || it.quantity || 1,
            price: it.price || null,
          })),
        };
      } else {
        this.cart = { items: [], ...local };
      }
    } else {
      const idb = await loadCartFromIDB(this.dbName, this.key);
      this.cart = idb ? { items: [], ...idb } : DEFAULT;
    }
    return this.cart;
  }

  async save() {
    const ok = setLocalCart(this.cart, this.key);
    if (!ok) {
      console.error('Failed to save cart to localStorage. Falling back to IndexedDB.');
      const idbOk = await saveCartToIDB(this.cart, this.dbName, this.key);
      if (!idbOk) {
        console.error('Failed to save cart to IndexedDB. Cart persistence may be compromised.');
      }
    }
    return this.cart;
  }

  get() {
    return this.cart;
  }

  async set(cart) {
    if (!cart || typeof cart !== 'object') {
      console.error('Invalid cart provided to set');
      return this.cart;
    }
    this.cart = { items: [], ...cart };  // Ensure items array exists
    return this.save();
  }

  async add(item) {
    if (!item || typeof item !== 'object') {
      console.error('Invalid item provided to add');
      return this.cart;
    }
    if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
      console.error('Cannot add item without valid SKU (id)');
      return this.cart;
    }
    // Validate price
    let validPrice = null;
    if (item.price !== undefined && item.price !== null) {
      const cleaned = String(item.price).trim().replace(/[^0-9.-]/g, '').replace(/,/g, '.');
      const n = Number(cleaned);
      validPrice = Number.isFinite(n) && n > 0 ? n : null;
    }
    if (validPrice === null) {
      console.error('Cannot add item without valid price');
      return this.cart;
    }
    // normalize size to empty string when not provided so storage is consistent
    const size = item.size !== undefined && item.size !== null ? item.size : '';
    const key = `${item.id}::${size}`;
    const existing = this.cart.items.find(
      (it) => `${it.id}::${it.size !== undefined && it.size !== null ? it.size : ''}` === key
    );
    if (existing) {
      const newQty = this.getUpdatedQuantity(existing, item.quantity || 1);
      await this.updateCartItemQuantity(existing, newQty);
    } else {
      // Ensure quantity is a number
      const cartItem = this.createCartItem(Object.assign({}, item, { size }));
      this.cart.items.push(cartItem);
      await this.save();
    }
    return this.cart;
  }

  createCartItem(item) {
    // Normalize price to a Number where possible to ensure arithmetic works reliably
    let parsed = null;
    if (item.price !== undefined && item.price !== null) {
      const cleaned = String(item.price).trim().replace(/[^0-9.-]/g, '').replace(/,/g, '.');
      const n = Number(cleaned);
      parsed = Number.isFinite(n) ? n : null;
    }
    return {
      id: item.id,
      name: item.name,
      size: item.size !== undefined && item.size !== null ? item.size : '',
      quantity: item.quantity || 1,
      price: parsed,
    };
  }

  async remove(id, size) {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('Invalid ID provided to remove');
      return this.cart;
    }
    if (size === undefined || size === null) {
      // If no size provided, remove all items with the matching ID (compatibility mode)
      this.cart.items = this.cart.items.filter((it) => it.id !== id);
    } else {
      // Original behavior: remove specific ID + size combination
      this.cart.items = this.cart.items.filter((it) => !(it.id === id && it.size === size));
    }
    return this.save();
  }

  // Update quantity for a specific item id+size combination. Size defaults to empty string
  updateQuantity(id, quantity, size = '') {
    const matchSize = (it) =>
      (it.size !== undefined && it.size !== null ? it.size : '') === (size || '');
    const idx = this.cart.items.findIndex(
      (it) => (it.id === id || `${it.id}` === `${id}`) && matchSize(it)
    );
    if (idx > -1) {
      if (quantity <= 0) {
        // Remove the item if the quantity is zero or less
        this.cart.items.splice(idx, 1);
      } else {
        // Update the item's quantity
        this.cart.items[idx].quantity = quantity;
      }
    } else {
      // Item with id and size not found in the cart.
    }
    return this.save();
  }

  updateCartItemQuantity(existing, newQuantity) {
    existing.quantity = parseInt(newQuantity, 10) || 0;
    // return the save promise so callers can await persistence
    return this.save();
  }

  getUpdatedQuantity(existing, additionalQuantity) {
    return (parseInt(existing.quantity, 10) || 0) + (parseInt(additionalQuantity, 10) || 0);
  }
}

// --- Shipping helpers (postcodes + postage data) ---
// These helpers load the refactored postcode file and the postage.json file
// and provide a small mapping from a destination postcode to a Sendle zone.
// The mapping is intentionally conservative and configurable via `opts`.

// Module-level caches for JSON data
let cachedPostcodes = null;

// Inlined postage rates from postage.json (updated 2026-01-21)
const POSTAGE_RATES = {"baseRates":{"pouch":{"sameCity":13,"nearMetro":13,"outerPerth":13,"national":13},"satchel":{"sameCity":15,"nearMetro":15,"outerPerth":15,"national":15},"handbag":{"sameCity":19,"nearMetro":19,"outerPerth":19,"national":19},"shoebox":{"sameCity":24,"nearMetro":24,"outerPerth":24,"national":24},"briefcase":{"sameCity":29,"nearMetro":29,"outerPerth":29,"national":29}},"regionalSurcharge":{"pouch":0,"satchel":0,"handbag":0,"shoebox":0,"briefcase":0},"remoteSurcharge":{"pouch":0,"satchel":0,"handbag":0,"shoebox":0,"briefcase":0}};

// Shared utility: parse weight string to grams
export function parseWeightString(wstr) {
  if (!wstr) return 0;
  const num = String(wstr)
    .replace(/,/g, '')
    .match(/[0-9]+(?:\.[0-9]+)?/);
  if (!num) return 0;
  const val = Number(num[0]);
  // Heuristic: if unit 'kg' present, convert to grams
  if (/kg/i.test(wstr)) return Math.round(val * 1000);
  return Math.round(val);
}

// Minimal parcel specs (max weight in grams). Moved to module level to avoid recreation on each call.
// Updated to match Sendle's domestic parcel size thresholds (grams):
// pouch 250g, satchel 500g, handbag 1000g, shoebox 3000g, briefcase 5000g,
// carryon 10000g, duffle 20000g, checkin 25000g
const PARCEL_SPECS = [
  { type: 'pouch', maxGrams: 250 }, // up to 250 g
  { type: 'satchel', maxGrams: 500 }, // up to 500 g
  { type: 'handbag', maxGrams: 1000 }, // up to 1 kg
  { type: 'shoebox', maxGrams: 3000 }, // up to 3 kg
  { type: 'briefcase', maxGrams: 5000 }, // up to 5 kg
  { type: 'carryon', maxGrams: 10000 }, // up to 10 kg
  { type: 'duffle', maxGrams: 20000 }, // up to 20 kg
  { type: 'checkin', maxGrams: 25000 }, // up to 25 kg
];

export async function loadJSONResource(path) {
  try {
    // Use default caching for static data files (postcodes, postage rates).
    // Browser will respect cache headers set by server for versioned URLs.
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

function normalizePostcode(pc) {
  if (pc == null) return '';
  const s = String(pc).trim();
  // Remove non-digits
  const digits = s.replace(/\D/g, '');
  return digits.padStart(4, '0').slice(-4);
}

// Map a postcode to one of: sameCity, nearMetro, outerPerth, national
// opts:
//  - storePostcode: string (4-digit) to treat exact match as sameCity
//  - storeState: e.g. 'WA' (default 'WA') used to decide nearMetro vs national
export async function getPostcodeZone(postcode, opts = {}) {
  const pc = normalizePostcode(postcode);
  const storeState = opts.storeState || 'WA';
  const storePc = opts.storePostcode ? normalizePostcode(opts.storePostcode) : null;

  if (!cachedPostcodes) {
    cachedPostcodes = await loadJSONResource('/assets/js/data/australian_postcodes.json');
  }
  const data = cachedPostcodes;
  if (!data || !data.postcodes) return 'national';

  if (storePc && pc === storePc) return 'sameCity';

  const entry = data.postcodes[pc];
  if (!entry) return 'national';

  const destState = (entry.state || '').toString().toUpperCase();
  const mmm = entry.mmm_2019 ? parseInt(String(entry.mmm_2019).replace(/\D/g, ''), 10) : null;

  // Heuristic mapping:
  // - If same state as store and MMM==1 => sameCity (metro core)
  // - If same state and MMM in [2,3] => nearMetro
  // - If same state but MMM >=4 => outerPerth (outer metro/regional within same state)
  // - Otherwise => national
  if (destState === storeState) {
    if (mmm === 1) return 'sameCity';
    if (mmm === 2 || mmm === 3) return 'nearMetro';
    if (mmm >= 4) return 'outerPerth';
    // Fallback: if region explicitly suggests metro, treat as nearMetro
    const region = (entry.region || '').toString().toUpperCase();
    if (/R1|R2|R3/.test(region)) return 'nearMetro';
    return 'nearMetro';
  }

  // Special-case: if destination state is WA but storeState differs, treat as national
  return 'national';
}

// Calculate the Sendle base rate for a parcel type and postcode.
// Returns an object: { zone, rate } where rate excludes GST and fuel surcharges
export async function calculateParcelRate(parcelType, postcode, opts = {}) {
  const p = (parcelType || '').toString().toLowerCase();
  const zone = await getPostcodeZone(postcode, opts);
  const postage = POSTAGE_RATES;
  if (!postage || !postage.baseRates) return { zone, rate: null };

  const typeRates = postage.baseRates[p];
  if (!typeRates) return { zone, rate: null };
  const rate =
    typeRates[zone] !== undefined && typeRates[zone] !== null ? Number(typeRates[zone]) : null;
  return { zone, rate };
}

// Calculate shipping based on total weight (grams) and postcode.
// Uses module-level PARCEL_SPECS array for weight-to-parcel mapping.
export async function calculateShippingByWeight(totalWeightGrams, postcode, opts = {}) {
  const w = Number(totalWeightGrams) || 0;
  const pc = normalizePostcode(postcode);

  // Load postcodes data (postage is inlined)
  if (!cachedPostcodes) {
    cachedPostcodes = await loadJSONResource('/assets/js/data/australian_postcodes.json');
  }
  const postage = POSTAGE_RATES;
  const postcodesData = cachedPostcodes;

  // Choose smallest parcel type that can accommodate weight
  const chosen = PARCEL_SPECS.find((s) => w <= s.maxGrams) || PARCEL_SPECS[PARCEL_SPECS.length - 1];
  const parcelType = chosen.type;

  // Base rate (uses existing helper)
  const base = await calculateParcelRate(parcelType, pc, opts);
  const zone = base.zone;
  if (!postage) return { parcelType, zone, baseRate: base.rate, totalRate: null };

  let total = base.rate === null || base.rate === undefined ? null : Number(base.rate);

  // Determine destination postcode meta (mmm band and destination state)
  let mmm = null;
  let destState = null;
  if (postcodesData && postcodesData.postcodes && postcodesData.postcodes[pc]) {
    const entry = postcodesData.postcodes[pc];
    mmm = entry && entry.mmm_2019 ? parseInt(String(entry.mmm_2019).replace(/\D/g, ''), 10) : null;
    destState = (entry.state || '').toString().toUpperCase();
  }

  // Apply surcharges:
  // - MMM >= 5 => remote surcharge (applies to remote locations)
  // - MMM === 4 => regional surcharge
  // - Additionally, if destination is WA or NT and MMM >=5, add remote WA/NT extra (per Sendle rules)
  if (total !== null) {
    if (postage.remoteSurcharge && mmm >= 5) {
      const extra = postage.remoteSurcharge[parcelType];
      if (extra) total += Number(extra);
      // Add WA/NT extra only when destination state is WA or NT
      if (
        (destState === 'WA' || destState === 'NT') &&
        postage.remoteWaNtExtra &&
        postage.remoteWaNtExtra[parcelType]
      ) {
        total += Number(postage.remoteWaNtExtra[parcelType]);
      }
    } else if (postage.regionalSurcharge && mmm === 4) {
      const extra = postage.regionalSurcharge[parcelType];
      if (extra) total += Number(extra);
    }

    // Apply over-length surcharge if requested (either explicit flag or lengthCm > 105)
    const lengthCm = opts && opts.lengthCm != null ? Number(opts.lengthCm) : null;
    const isOverLengthByValue = Number.isFinite(lengthCm) && lengthCm > 105;
    if (opts && (opts.overLength === true || isOverLengthByValue)) {
      if (postage.overLengthSurcharge) total += Number(postage.overLengthSurcharge);
    }
  }

  return {
    parcelType,
    zone,
    baseRate: base.rate,
    totalRate: total,
    chosenSpec: chosen,
    mmm,
  };
}

// Testing hooks: allow injecting caches for unit tests / debug
export function __setCachedPostcodes(data) {
  cachedPostcodes = data;
}
export function __setCachedPostage(data) {
  cachedPostage = data;
}
export function __resetCaches() {
  cachedPostcodes = null;
}

// Backwards-compatibility helpers: allow modules to obtain the global window.CartStore
// when present, otherwise create and return an instance of the exported `CartStore` class.
export async function getGlobalStore() {
  if (typeof window !== 'undefined' && window.CartStore) return window.CartStore;
  // Fallback: create an instance of the module CartStore and initialise it
  try {
    const inst = new CartStore();
    if (typeof inst.init === 'function') await inst.init();
    return inst;
  } catch (err) {
    console.warn('getGlobalStore fallback failed', err);
    return null;
  }
}

// Default proxy export: forwards common store operations to `window.CartStore` when available,
// otherwise uses the module-local CartStore implementation. Methods are async where persistence
// may occur so callers can `await` them.
const StoreProxy = {
  async init() { const s = await getGlobalStore(); return s && s.init ? s.init() : s; },
  get() { try { if (typeof window !== 'undefined' && window.CartStore) return window.CartStore.get(); } catch (e) {} return DEFAULT; },
  async set(cart) { const s = await getGlobalStore(); return s && s.set ? s.set(cart) : null; },
  async add(item) { const s = await getGlobalStore(); return s && s.add ? s.add(item) : null; },
  async remove(id, size) { const s = await getGlobalStore(); return s && s.remove ? s.remove(id, size) : null; },
  async updateQuantity(id, qty, size) { const s = await getGlobalStore(); return s && s.updateQuantity ? s.updateQuantity(id, qty, size) : null; },
  async clear() { const s = await getGlobalStore(); return s && s.clear ? s.clear() : null; },
};

export default StoreProxy;
