// Lightweight localStorage wrapper for cart persistence
export function getLocalCart(key = 'naturesi_cart') {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setLocalCart(cart, key = 'naturesi_cart') {
  try {
    localStorage.setItem(key, JSON.stringify(cart));
    return true;
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
    return false;
  }
}

export function removeLocalCart(key = 'naturesi_cart') {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}
