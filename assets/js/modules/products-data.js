// Module: Products data loader (dynamic JSON fetch)
// Purpose: central place to load products.json for client-side features (search, category counts, etc.)
// Notes: Replaced static `import ... assert { type: 'json' }` which causes SyntaxError in some browsers.

let productsCache = null;

export async function getProducts() {
  if (productsCache) return productsCache;

  try {
    const url = new URL('../data/products.json', import.meta.url).href;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Network response was not ok: ' + resp.status);
    const data = await resp.json();
    // products.json historically exports an object with a `products` array
    productsCache = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
    return productsCache;
  } catch (e) {
    /* eslint-disable no-console */
    console.log('Failed to load products.json:', e);
    /* eslint-enable no-console */
    productsCache = [];
    return productsCache;
  }
}

export default getProducts;
