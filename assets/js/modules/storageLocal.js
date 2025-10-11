// Lightweight localStorage wrapper for cart persistence
export function getLocalCart(key = 'naturesi-cart') {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function setLocalCart(cart, key = 'naturesi-cart') {
    try {
        localStorage.setItem(key, JSON.stringify(cart));
        return true;
    } catch (e) {
        return false;
    }
}

export function removeLocalCart(key = 'naturesi-cart') {
    try { localStorage.removeItem(key); return true; } catch (e) { return false; }
}
