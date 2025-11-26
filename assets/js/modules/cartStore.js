import { getLocalCart, setLocalCart } from './storageLocal.js';
import { loadCartFromIDB, saveCartToIDB } from './storageIDB.js';

const DEFAULT = { items: [] };

export class CartStore {
    constructor(opts = {}) {
        this.key = opts.key || 'naturesi-cart';
        this.dbName = opts.dbName || 'naturesi_cart_db';
        this.cart = DEFAULT;
    }

    async init() {
        const local = getLocalCart(this.key);
        if (local) {
            this.cart = local;
        } else {
            const idb = await loadCartFromIDB(this.dbName, this.key);
            this.cart = idb || DEFAULT;
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

    get() { return this.cart; }

    async add(item) {
        // normalize size to empty string when not provided so storage is consistent
        const size = (item.size !== undefined && item.size !== null) ? item.size : '';
        const key = `${item.id}::${size}`;
        const existing = this.cart.items.find((it) => `${it.id}::${(it.size !== undefined && it.size !== null) ? it.size : ''}` === key);
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
        return {
            id: item.id,
            name: item.name,
            size: (item.size !== undefined && item.size !== null) ? item.size : '',
            quantity: item.quantity || 1,
            price: item.price || null
        };
    }

    remove(id, size) {
        this.cart.items = this.cart.items.filter((it) => !(it.id === id && it.size === size));
        return this.save();
    }

    // Update quantity for a specific item id+size combination. Size defaults to empty string
    updateQuantity(id, quantity, size = '') {
        const matchSize = (it) => ((it.size !== undefined && it.size !== null) ? it.size : '') === (size || '');
        const idx = this.cart.items.findIndex((it) => (it.id === id || `${it.id}` === `${id}`) && matchSize(it));
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

export async function _loadJSON(path) {
    try {
        const res = await fetch(path, { cache: 'no-cache' });
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

    const data = await _loadJSON('/assets/js/data/australian_postcodes.json');
    if (!data || !data.postcodes) return 'national';

    if (storePc && pc === storePc) return 'sameCity';

    const entry = data.postcodes[pc];
    if (!entry) return 'national';

    // Prefer a chargezone->direct mapping if present (some entries include chargezone codes)
    const cz = (entry.chargezone || '').toString().toUpperCase();
    if (cz && /WA|N2|N1|NT|QLD|VIC|NSW|SA|TAS/.test(cz)) {
        // Basic heuristic: if chargezone contains 'NT' or 'N' treat as national, else
        // we'll fall back to state/mmm mapping below
    }

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
    const postage = await _loadJSON('/assets/js/data/postage.json');
    if (!postage || !postage.baseRates) return { zone, rate: null };

    const typeRates = postage.baseRates[p];
    if (!typeRates) return { zone, rate: null };
    const rate = (typeRates[zone] !== undefined && typeRates[zone] !== null) ? Number(typeRates[zone]) : null;
    return { zone, rate };
}
