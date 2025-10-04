// Module: Update the category hub on store pages with product counts
import { getProducts } from './products-data.js';
import productCategories from '../data/product-categories.json' assert { type: 'json' };
import categoriesData from '../data/categories.json' assert { type: 'json' };

export async function updateCategoryHubCounts() {
  try {
    const hub = document.querySelector('.category-hub');
    if (!hub) return;

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
