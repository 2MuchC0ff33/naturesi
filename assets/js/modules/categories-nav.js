// categories-nav.js
// Small client-side DOM builder for the header categories nav.
// Categories are inlined from categories.json — no fetch needed.
const CATEGORIES = [
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

// Track active prefetches for cancellation
const activePrefetches = new Map();

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
function sendPrefetchMessage(href, priority = 'normal') {
  if (!href) return;
  const url = new URL(href, window.location.origin).href;
  try {
    if (navigator.serviceWorker?.getRegistration) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.active?.postMessage) {
          const id = Date.now() + Math.random();
          reg.active.postMessage({
            type: 'PRELOAD_NAVIGATION',
            url,
            id,
            priority
          });
          // Store ID for potential cancellation
          activePrefetches.set(url, id);
        }
      }).catch(() => { });
    }
  } catch (_e) { }
}

// Attach hover/focus prefetch to anchors
function attachPrefetchHandlers(container) {
  const links = Array.from(container.querySelectorAll('a.site-header__categories-link'));
  const timers = new Map();
  links.forEach(a => {
    const href = a.getAttribute('href');
    // Prefetch on hover or keyboard focus (debounced 120ms)
    const schedule = () => {
      if (timers.has(href)) return;
      const t = setTimeout(() => { sendPrefetchMessage(href); timers.delete(href); }, 120);
      timers.set(href, t);
    };
    const cancel = () => {
      const t = timers.get(href);
      if (t) {
        clearTimeout(t);
        timers.delete(href);
        // Cancel preload if not yet started
        const url = new URL(href, window.location.origin).href;
        const id = activePrefetches.get(url);
        if (id) {
          try {
            if (navigator.serviceWorker?.getRegistration) {
              navigator.serviceWorker.getRegistration().then(reg => {
                if (reg?.active) {
                  reg.active.postMessage({ type: 'CANCEL_PRELOAD', url });
                }
              });
            }
          } catch (_e) { }
          activePrefetches.delete(url);
        }
      }
    };
    a.addEventListener('mouseenter', schedule, { passive: true });
    a.addEventListener('focus', schedule, { passive: true });
    a.addEventListener('mouseleave', cancel, { passive: true });
    a.addEventListener('blur', cancel, { passive: true });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('.site-header__categories-list');
  if (!list) return;
  buildCategoriesList(list, CATEGORIES);
  list.removeAttribute('aria-hidden');
});
