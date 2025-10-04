// Module: Client-side product search
// Purpose: Implement a static HTML5 client-side search that uses the bundled
// products.json and product-categories mapping. This runs on pages/search.html
// and enhances the header search form so results render without a full page reload.
import { getProducts } from './products-data.js';
import productCategories from '../data/product-categories.json' assert { type: 'json' };

function slugify(text) {
  return (
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || ''
  );
}

function matchesQuery(product, q) {
  if (!q) return true;
  const terms = q.toString().toLowerCase().split(/\s+/).filter(Boolean);

  if (!terms.length) return true;

  const hay = [
    product.name || '',
    product.description || '',
    `${product.shortDescription || ''} ${product.ingredients || ''}`,
    Array.isArray(product.tags) ? product.tags.join(' ') : product.tags || '',
    product.keywords || '',
  ]
    .join(' ')
    .toLowerCase();

  return terms.every((t) => hay.indexOf(t) !== -1);
}

export async function initSearchClient() {
  const form = document.querySelector('.site-search');
  const resultsSection = document.getElementById('all-products');
  if (!form || !resultsSection) return; // nothing to do on other pages

  const input = form.querySelector('input[name="q"]');
  const hiddenCategory = form.querySelector('#search-category');
  const listbox = form.querySelector('.category-dropdown ul[role="listbox"]');

  // Accessible status region
  let status = resultsSection.querySelector('.search-status');
  if (!status) {
    status = document.createElement('div');
    status.className = 'search-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    resultsSection.insertBefore(status, resultsSection.firstChild);
  }

  // Read current query params and hydrate the form
  function hydrateFromUrl() {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    const category = params.get('category') || '';
    if (input) input.value = q;
    if (hiddenCategory) hiddenCategory.value = category;
    // Mark selected in listbox for accessibility
    if (listbox) {
      listbox.querySelectorAll('li[role="option"]').forEach((li) => {
        const v = li.dataset && li.dataset.value ? li.dataset.value : '';
        li.setAttribute('aria-selected', v === category ? 'true' : 'false');
      });
    }
    return { q, category };
  }

  // configurable debounce — set data-debounce-ms on the form to override the default
  const debounceMs = (function () {
    try {
      const v = parseInt(form.dataset.debounceMs, 10);
      return Number.isFinite(v) && v > 0 ? v : 300;
    } catch (e) {
      return 300;
    }
  })();

  // Perform search and render results into resultsSection
  async function performSearch(q, category) {
    status.classList.add('loading');
    status.textContent = 'Searching...';
    try {
      const products = await getProducts();
      const mapping =
        productCategories && productCategories.mapping ? productCategories.mapping : {};

      const filtered = products.filter((p) => {
        // category filter
        if (category) {
          const mapped = mapping[p.id] || slugify(p.name || '');
          if (mapped !== category) return false;
        }
        return matchesQuery(p, q);
      });

      // Render
      resultsSection.innerHTML = '';
      resultsSection.appendChild(status);

      const heading = document.createElement('h2');
      heading.textContent = q ? `Search results for "${q}"` : 'Search results';
      resultsSection.appendChild(heading);

      const count = document.createElement('p');
      count.className = 'search-count';
      count.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
      resultsSection.appendChild(count);

      if (!filtered.length) {
        const empty = document.createElement('p');
        empty.textContent = q
          ? `No products matched "${q}" in the selected category.`
          : 'No products found in the selected category.';
        resultsSection.appendChild(empty);
        status.textContent = `${filtered.length} results`;
        return;
      }

      const ul = document.createElement('ul');
      ul.className = 'search-results';
      ul.setAttribute('role', 'list');

      filtered.forEach((p) => {
        const li = document.createElement('li');
        li.className = 'search-result-item';

        // Thumbnail (if available)
        const imgSrc = p.images && p.images.length ? p.images[0] : null;
        if (imgSrc) {
          const thumb = document.createElement('div');
          thumb.className = 'search-result-thumb';
          const img = document.createElement('img');
          // Ensure image path is rooted so relative paths resolve to site root
          img.src = imgSrc.indexOf('://') !== -1 ? imgSrc : '/' + imgSrc.replace(/^\/+/, '');
          img.alt = (p.name || 'Product') + ' image';
          img.loading = 'lazy';
          thumb.appendChild(img);
          li.appendChild(thumb);
        }

        // Content container ensures good wrapping alongside the thumbnail
        const content = document.createElement('div');
        content.className = 'search-result-content';

        const a = document.createElement('a');
        const slug = mapping[p.id] || slugify(p.name || '');
        a.href = `/pages/store.html#${encodeURIComponent(slug)}`;
        a.textContent = p.name || 'Untitled product';
        a.setAttribute('aria-label', `${a.textContent} — View in store`);

        const desc = document.createElement('p');
        desc.className = 'search-result-description';
        desc.textContent = (p.shortDescription || p.description || '').slice(0, 220);

        content.appendChild(a);
        if (desc.textContent) content.appendChild(desc);
        li.appendChild(content);
        ul.appendChild(li);
      });

      resultsSection.appendChild(ul);
      status.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
    } catch (err) {
      status.textContent = 'Search failed';
      /* eslint-disable no-console */
      console.error('Search failure', err);
      /* eslint-enable no-console */
    } finally {
      // Ensure loading indicator is removed even if render fails
      status.classList.remove('loading');
    }
  }

  // Simple debounce helper
  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      if (t) clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Live search: debounce input events so typing performs searches
  if (input) {
    const debounced = debounce((ev) => {
      const qVal = ev && ev.target ? ev.target.value.trim() : (input.value || '').trim();
      const cat = hiddenCategory ? hiddenCategory.value : '';
      // Update URL (replace state so typing doesn't flood history)
      const url = new URL(location.href);
      if (qVal) url.searchParams.set('q', qVal);
      else url.searchParams.delete('q');
      if (cat) url.searchParams.set('category', cat);
      else url.searchParams.delete('category');
      history.replaceState({}, '', url.toString());
      // Show loading immediately for perceived responsiveness
      status.classList.add('loading');
      status.textContent = 'Searching...';
      performSearch(qVal, cat);
    }, debounceMs);

    input.addEventListener('input', debounced);
  }

  // Form submit: enhance to run client-side search and update URL without reload
  form.addEventListener('submit', function (ev) {
    // Only intercept if we're already on the search page – otherwise let normal navigation happen
    const isSearchPage =
      location.pathname && location.pathname.indexOf('/pages/search.html') !== -1;
    const q = input ? input.value.trim() : '';
    const category = hiddenCategory ? hiddenCategory.value : '';
    if (isSearchPage) {
      ev.preventDefault();
      const url = new URL(location.href);
      if (q) url.searchParams.set('q', q);
      else url.searchParams.delete('q');
      if (category) url.searchParams.set('category', category);
      else url.searchParams.delete('category');
      history.pushState({}, '', url.toString());
      performSearch(q, category);
      // update status text for SRs
      status.textContent = 'Search updated';
    }
    // If not on search page, allow default submit to navigate to search page
  });

  // When user clicks category options within the search form, run a search immediately
  if (listbox) {
    listbox.addEventListener('click', function (ev) {
      const li = ev.target.closest('li[role="option"]');
      if (!li) return;
      const value = li.dataset && li.dataset.value ? li.dataset.value : '';
      if (hiddenCategory) hiddenCategory.value = value;
      // If we're on the search page, perform search immediately with current query
      const q = input ? input.value.trim() : '';
      const isSearchPage =
        location.pathname && location.pathname.indexOf('/pages/search.html') !== -1;
      if (isSearchPage) {
        // reflect category in the URL without adding history entries
        const url = new URL(location.href);
        if (value) url.searchParams.set('category', value);
        else url.searchParams.delete('category');
        history.replaceState({}, '', url.toString());
        performSearch(q, value);
      }
    });
  }

  // Handle history navigation
  window.addEventListener('popstate', () => {
    const { q, category } = hydrateFromUrl();
    performSearch(q, category);
  });

  // Initial hydrate and search run
  const params = hydrateFromUrl();
  performSearch(params.q, params.category);
}

export default initSearchClient;
