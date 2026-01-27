// Simple module to insert a featured badge into product cards when data-featured="true" is present
export async function initFeaturedBadges(documentRoot = typeof document !== 'undefined' ? document : null) {
  if (!documentRoot) return;

  // First, try wiring featured flags from products.json (non-blocking but helpful)
  try {
    await wireFeaturedFromProducts(documentRoot);
  } catch (e) {
    // ignore wiring failures - we'll still handle any existing data-featured attributes
    console.warn('Featured wiring failed', e);
  }

  const featuredEls = documentRoot.querySelectorAll('[data-featured="true"]');
  if (!featuredEls || featuredEls.length === 0) return;

  featuredEls.forEach((el) => {
    // target the .product-card element
    const card = el.closest('.product-card') || el;
    if (!card) return;
    // Avoid duplicate badges
    if (card.querySelector('.product-card__badge')) return;

    const span = document.createElement('span');
    span.className = 'product-card__badge';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = 'Featured';

    // Prefer to append to the card so it appears visually in the top-right (CSS positions it)
    card.appendChild(span);
  });
}

export async function wireFeaturedFromProducts(documentRoot = typeof document !== 'undefined' ? document : null) {
  if (!documentRoot || typeof fetch === 'undefined') return;
  try {
    const res = await fetch('/assets/js/data/products.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('products.json fetch failed: ' + res.status);
    const json = await res.json();
    const products = Array.isArray(json.products) ? json.products : [];
    if (!products.length) return;

    products.forEach((p) => {
      if (!p || !p.featured) return;
      const name = (p.name || '').trim().toLowerCase();
      const sku = (p.sku || '').trim();
      const id = (p.id || '').trim();

      // Match by data-sku attribute (exact)
      if (sku) {
        const els = Array.from(documentRoot.querySelectorAll(`[data-sku]`));
        els.forEach((el) => {
          const ds = (el.getAttribute('data-sku') || '').trim();
          if (!ds) return;
          if (ds === sku || ds.indexOf(sku) !== -1 || sku.indexOf(ds) !== -1) {
            el.setAttribute('data-featured', 'true');
          }
        });
      }

      // Match by id attribute (exact)
      if (id) {
        const byId = documentRoot.getElementById(id);
        if (byId) byId.setAttribute('data-featured', 'true');
      }

      // Match by product title text (h3 or h4 matching product name)
      if (name) {
        const headings = Array.from(documentRoot.querySelectorAll('h3[itemprop="name"], h3, h4[itemprop="name"], h4'));
        headings.forEach((h) => {
          if ((h.textContent || '').trim().toLowerCase() === name) {
            const card = h.closest('.product-card') || h.closest('.product') || h;
            if (card) card.setAttribute('data-featured', 'true');
          }
        });
      }
    });
  } catch (err) {
    // Keep failures silent but logged for devs
    console.warn('wireFeaturedFromProducts error', err);
  }
}

// Auto-run in browser contexts
if (typeof document !== 'undefined') {
  try {
    // Call the async init but do not await here (non-blocking)
    initFeaturedBadges(document);
  } catch (e) {
    // silently ignore errors
    console.warn('Featured badges init failed', e);
  }
}
