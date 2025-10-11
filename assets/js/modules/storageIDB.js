// IndexedDB wrapper to store/retrieve the cart when localStorage isn't available
export function loadCartFromIDB(dbName = 'naturesi_cart_db', key = 'naturesi-cart') {
    return new Promise((resolve) => {
        if (!('indexedDB' in window)) return resolve(null);
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

export function saveCartToIDB(cart, dbName = 'naturesi_cart_db', key = 'naturesi-cart') {
    return new Promise((resolve) => {
        if (!('indexedDB' in window)) return resolve(false);
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
            putReq.onerror = () => resolve(false);
        };
        req.onerror = () => resolve(false);
    });
}
