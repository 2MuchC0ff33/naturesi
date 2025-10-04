// Module: Products data loader (static JSON import)
// Purpose: central place to import products.json for client-side features (search, category counts, etc.)
// Notes: using a static JSON module import with an assertion simplifies code and makes bundling optional.
// Keep the async getProducts() API for backwards compatibility with callers.
import productsWrapped from '../data/products.json' assert { type: 'json' };

// productsWrapped is an object with a `products` array; normalize API to return products array
export async function getProducts() {
  return Array.isArray(productsWrapped.products) ? productsWrapped.products : [];
}

export default getProducts;
