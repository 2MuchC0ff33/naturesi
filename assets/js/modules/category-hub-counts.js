// Module: Update the category hub on store pages with product counts
import { getProducts } from './products-data.js';

// Replace static JSON imports (which used `assert { type: 'json' }`) with runtime loaders
let productCategories = null;
let categoriesData = null;

async function loadJSON(relativePath) {
  const url = new URL(relativePath, import.meta.url).href;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Failed to load ' + url + ': ' + resp.status);
  return resp.json();
}

export async function updateCategoryHubCounts() {
  try {
    const hub = document.querySelector('.category-hub');
    if (!hub) return;

    // Ensure productCategories and categoriesData are loaded
    if (!productCategories) {
      try {
        productCategories = await loadJSON('../data/product-categories.json');
      } catch (e) {
        productCategories = {};
      }
    }

    if (!categoriesData) {
      try {
        categoriesData = await loadJSON('../data/categories.json');
      } catch (e) {
        categoriesData = { categories: [] };
      }
    }

    const products = await getProducts();
    const mapping = productCategories && productCategories.mapping ? productCategories.mapping : {};

    const counts = {};
    categoriesData.categories.forEach((c) => (counts[c.slug || ''] = 0));

    products.forEach((p) => {
      const cat = mapping[p.id] || 'wellness-blends';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    // Update the hub list items with counts
    hub.querySelectorAll('li').forEach((li) => {
      const a = li.querySelector('a');
      if (!a) return;
      // Determine slug from href - support both #slug and filename-based links
      let slug = '';
      try {
        const href = a.getAttribute('href') || '';
        if (href.indexOf('#') !== -1) slug = href.split('#').pop();
        else {
          // /pages/store/wellness-blends.html -> wellness-blends
          const m = href.match(/([^/]+)\.html$/);
          if (m) slug = m[1];
        }
      } catch (e) {
        slug = '';
      }

      const count = counts[slug] || 0;
      // Append count to the anchor text if not already present
      const baseLabel =
        (categoriesData.categories.find((c) => (c.slug || '') === slug) || {}).label ||
        a.textContent.replace(/\s*\(\d+\)$/, '');
      a.textContent = baseLabel + (count > 0 ? ' (' + count + ')' : '');
    });
  } catch (e) {
    /* eslint-disable no-console */
    console.log('Failed to update category hub counts', e);
    /* eslint-enable no-console */
  }
}
