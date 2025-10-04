// Module: Category dropdown wiring for the site search
// Purpose: decouple the category wiring logic from the main app to make it easier to extend (e.g. populate from products.json later)
import categoriesData from '../data/categories.json' assert { type: 'json' };
import productCategories from '../data/product-categories.json' assert { type: 'json' };
import { getProducts } from './products-data.js';

export function initCategoryDropdown() {
  const categoryList = document.querySelector('.category-dropdown ul[role="listbox"]');
  const hiddenCategory = document.getElementById('search-category');

  if (!categoryList || !hiddenCategory) return;

  // If the list is empty (authoring omitted it), populate from categories.json
  if (!categoryList.querySelector('li')) {
    categoriesData.categories.forEach((c, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('tabindex', '0');
      li.dataset.value = c.slug || '';
      li.textContent = c.label || c.slug || 'Category ' + (idx + 1);
      categoryList.appendChild(li);
    });
  }

  // Compute and append category counts asynchronously
  (async function appendCategoryCounts() {
    try {
      const products = await getProducts();
      const counts = {};
      // initialise counts for all known categories
      categoriesData.categories.forEach((c) => (counts[c.slug || ''] = 0));

      const mapping =
        productCategories && productCategories.mapping ? productCategories.mapping : {};

      const categorize = (p) => {
        if (mapping[p.id]) return mapping[p.id];
        const name = (p.name || '').toLowerCase();
        if (/chai|earl|breakfast|black|ceylon/.test(name)) return 'black-tea';
        if (/green|sencha/.test(name)) return 'green-tea';
        if (/pillow|flask|infuser|bag|scoop|pot/.test(name)) return 'accessories';
        if (/balm/.test(name)) return 'balms';
        if (/cream|calendula/.test(name)) return 'creams';
        return 'wellness-blends';
      };

      products.forEach((p) => {
        const cat = categorize(p) || '';
        counts[cat] = (counts[cat] || 0) + 1;
      });

      // Update UI labels with counts
      categoryList.querySelectorAll('li[role="option"]').forEach((li) => {
        const slug = li.dataset && li.dataset.value ? li.dataset.value : '';
        const count = counts[slug] || 0;
        // Avoid duplicating counts if handler runs multiple times
        li.textContent =
          (
            categoriesData.categories.find((c) => (c.slug || '') === slug) || {
              label: li.textContent,
            }
          ).label + (count > 0 ? ' (' + count + ')' : '');
      });
    } catch (e) {
      /* eslint-disable no-console */
      console.log('Failed to compute category counts:', e);
      /* eslint-enable no-console */
    }
  })();

  // Click / tap handler: set hidden input and mark aria-selected for accessibility
  categoryList.addEventListener('click', function (ev) {
    const li = ev.target.closest('li[role="option"]');
    if (!li) return;
    // Prevent default navigation if the option contains an anchor — JS-enhanced behaviour
    if (ev.target && ev.target.closest && ev.target.closest('a')) ev.preventDefault();
    const value = li.dataset && li.dataset.value ? li.dataset.value : '';
    hiddenCategory.value = value;

    categoryList.querySelectorAll('li[role="option"]').forEach((opt) => {
      opt.setAttribute('aria-selected', opt === li ? 'true' : 'false');
    });
  });
    // Close parent <details> if present to give immediate feedback
    const details = li.closest('details');
    if (details && details.open) details.open = false;

  // Keyboard support: Enter and Space activate options
  categoryList.addEventListener('keydown', function (ev) {
    const li = ev.target.closest('li[role="option"]');
    if (!li) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      li.click();
    }
  });
}
