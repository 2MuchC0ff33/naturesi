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
            await saveCartToIDB(this.cart, this.dbName, this.key);
        }
        return this.cart;
    }

    get() { return this.cart; }

    add(item) {
        const key = `${item.id}::${item.size}`;
        const existing = this.cart.items.find((it) => `${it.id}::${it.size}` === key);
        if (existing) existing.quantity = (existing.quantity || 0) + (item.quantity || 1);
        else this.cart.items.push({ id: item.id, name: item.name, size: item.size, quantity: item.quantity || 1, price: item.price || null });
        return this.save();
    }

    remove(id) {
        this.cart.items = this.cart.items.filter((it) => it.id !== id && `${it.id}` !== `${id}`);
        return this.save();
    }

    updateQuantity(id, quantity) {
        const idx = this.cart.items.findIndex((it) => it.id === id || `${it.id}` === `${id}`);
        if (idx > -1) {
            if (quantity <= 0) this.cart.items.splice(idx, 1);
            else this.cart.items[idx].quantity = quantity;
        }
        return this.save();
    }
}
