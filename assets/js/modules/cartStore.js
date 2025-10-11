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
        const key = `${item.id}::${item.size}`;
        const existing = this.cart.items.find((it) => `${it.id}::${it.size}` === key);
        if (existing) {
            const newQty = this.getUpdatedQuantity(existing, item.quantity || 1);
            await this.updateCartItemQuantity(existing, newQty);
        } else {
            // Ensure quantity is a number
            const cartItem = this.createCartItem(item);
            this.cart.items.push(cartItem);
            await this.save();
        }
        return this.cart;
    }

    createCartItem(item) {
        return {
            id: item.id,
            name: item.name,
            size: item.size,
            quantity: item.quantity || 1,
            price: item.price || null
        };
    }

    remove(id, size) {
        this.cart.items = this.cart.items.filter((it) => !(it.id === id && it.size === size));
        return this.save();
    }

    updateQuantity(id, quantity) {
        const idx = this.cart.items.findIndex((it) => it.id === id || `${it.id}` === `${id}`);
        if (idx > -1) {
            if (quantity <= 0) {
                // Remove the item if the quantity is zero or less
                this.cart.items.splice(idx, 1);
            } else {
                // Update the item's quantity
                this.cart.items[idx].quantity = quantity;
            }
        } else {
            // Item with id not found in the cart.
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
