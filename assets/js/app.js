// Module entrypoint: import smaller modules and initialise behaviours
// This file was refactored to be an ES module so individual behaviours can be maintained separately.
import { registerServiceWorker } from './modules/sw-register.js';
import { initDevHelpers } from './modules/dev-helpers.js';
import { wireFooterAccordionHandlers, initFooterAccordions } from './modules/footer-accordion.js';
import { initCategoryDropdown } from './modules/category-dropdown.js';
import { updateCategoryHubCounts } from './modules/category-hub-counts.js';
import { getProducts } from './modules/products-data.js';

// Initialise service worker registration (keeps original guards intact)
registerServiceWorker();

// Development helpers (no-op on production)
initDevHelpers();

// DOM ready wiring
document.addEventListener('DOMContentLoaded', () => {
  wireFooterAccordionHandlers();
  initCategoryDropdown();
  updateCategoryHubCounts();

  // Load products.json in the background to demonstrate modular JSON loading
  // and to warm any future client-side search or category-count features.
  getProducts()
    .then((products) => {
      /* eslint-disable no-console */
      const count = Array.isArray(products) ? products.length : 'unknown';
      console.log('Products loaded (modular):', count);
      /* eslint-enable no-console */
    })
    .catch((err) => {
      /* eslint-disable no-console */
      console.log('Products.json load failed:', err);
      /* eslint-enable no-console */
    });
});

// Responsive accordion initialisation (on load + debounced resize) - preserve original UX
window.addEventListener('load', initFooterAccordions);
window.addEventListener('resize', () => {
  clearTimeout(window.__footerAccordionResizeTimer);
  window.__footerAccordionResizeTimer = setTimeout(initFooterAccordions, 120);
});
