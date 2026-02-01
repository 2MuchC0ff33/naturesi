// categories-nav.js
// Small client-side DOM builder for the header categories nav.
const CATEGORIES_JSON = '/assets/js/data/categories.json';
const DEFAULT_CATEGORIES = [
  { label: 'Show All', href: '/pages/store.html' },
  { label: 'Wellness Blends', href: '/pages/store/wellness-blends.html' },
  { label: 'Artisan Blends', href: '/pages/store/artisan-blends.html' },
  { label: 'Herbal Infusions', href: '/pages/store/herbal-infusions.html' },
  { label: 'Black Tea', href: '/pages/store/black-tea.html' },
  { label: 'Green Tea', href: '/pages/store/green-tea.html' },
  { label: 'Ice Tea', href: '/pages/store/ice-tea.html' },
  { label: 'Herbal Balms', href: '/pages/store/balms.html' },
  { label: 'Herbal Creams', href: '/pages/store/creams.html' },
  { label: 'Self Care', href: '/pages/store/selfcare.html' },
  { label: 'Accessories', href: '/pages/store/accessories.html' }
];

function buildCategoriesList(container, categories) {
  container.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none');
    const a = document.createElement('a');
    a.className = 'site-header__categories-link';
    a.setAttribute('role', 'menuitem');
    a.href = cat.href || '#';
    a.textContent = cat.label || cat.name || 'Category';
    li.appendChild(a);
    container.appendChild(li);
  });
  attachPrefetchHandlers(container);
}

// Send a prefetch request message to the service worker (best-effort)
function sendPrefetchMessage(href){
  if (!href) return;
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.active && reg.active.postMessage) {
          try { reg.active.postMessage({ type: 'PREFETCH_PAGE', href: href }); } catch(_){}
        }
      }).catch(()=>{});
    }
  } catch (e) {}
}

// Attach hover/focus prefetch to anchors
function attachPrefetchHandlers(container){
  const links = Array.from(container.querySelectorAll('a.site-header__categories-link'));
  const timers = new Map();
  links.forEach(a => {
    const href = a.getAttribute('href');
    // Prefetch on hover or keyboard focus (debounced 120ms)
    const schedule = () => {
      if (timers.has(href)) return;
      const t = setTimeout(()=>{ sendPrefetchMessage(href); timers.delete(href); }, 120);
      timers.set(href, t);
    };
    const cancel = () => { const t = timers.get(href); if (t) { clearTimeout(t); timers.delete(href); } };
    a.addEventListener('mouseenter', schedule, { passive: true });
    a.addEventListener('focus', schedule, { passive: true });
    a.addEventListener('mouseleave', cancel, { passive: true });
    a.addEventListener('blur', cancel, { passive: true });
  });
}

function tryFetchCategories() {
  return fetch(CATEGORIES_JSON, { cache: 'no-store' })
    .then(resp => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then(data => {
      // Expecting an array of categories with label and href or slug
        // Accept two shapes: either the JSON is an array, or an object with `categories` array.
        const arr = Array.isArray(data) ? data : (Array.isArray(data.categories) ? data.categories : null);
        if (arr && arr.length) return arr.map(item => {
          const label = item.label || item.name || item.title || item;
          // prefer explicit href or slug; otherwise derive a safe filename from slug or label
          let href = item.href || null;
          const slug = item.slug || item.id || null;
          if (!href) {
            if (slug) {
              href = `/pages/store/${String(slug).toLowerCase()}.html`;
            } else {
              // derive slug from label: lowercase, remove apostrophes, replace non-word chars with hyphen
              const derived = String(label).toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              href = `/pages/store/${derived}.html`;
            }
          }
          return { label, href };
        });
      throw new Error('Unexpected data');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('.site-header__categories-list');
  if (!list) return;

  // Populate with default immediately for perceived performance
  buildCategoriesList(list, DEFAULT_CATEGORIES);
  list.removeAttribute('aria-hidden');

  // Try load canonical categories.json and replace list if successful
  tryFetchCategories()
    .then(items => {
      if (items && items.length) buildCategoriesList(list, items);
    })
    .catch(() => {
      // keep defaults on failure
    });
});
