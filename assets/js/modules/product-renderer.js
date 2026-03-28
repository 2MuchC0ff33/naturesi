let _products = null;
let _fetchedAt = 0;
const CACHE_TTL = 60 * 1000;

async function fetchProducts() {
  const now = Date.now();
  if (_products && (now - _fetchedAt) < CACHE_TTL) return _products;
  try {
    const res = await fetch('/assets/js/data/products.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _products = Array.isArray(data.products) ? data.products : [];
    _fetchedAt = now;
    return _products;
  } catch (err) {
    console.error('product-renderer: failed to load products', err);
    return [];
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function priceText(n) {
  return typeof n === 'number' ? `$${n.toFixed(2)}` : '';
}

function renderOptionRadios(product, selectedId) {
  if (!product.options || product.options.length <= 1) return '';
  const lines = product.options.map((opt) => {
    const checked = opt.id === selectedId ? ' checked' : '';
    const p = typeof opt.price === 'number' ? priceText(opt.price) : '';
    return (
      `<label class="u-d-flex u-items-center u-gap-2">` +
      `<input type="radio" name="product-option-${escapeHtml(product.id)}"` +
      ` value="${escapeHtml(opt.id)}"${checked} data-price="${opt.price}" data-weight="${escapeHtml(opt.weight || '')}"> ` +
      `${escapeHtml(opt.label)} ${p ? `(${p})` : ''}</label>`
    );
  });
  return `<div class="product-options-list" role="radiogroup" aria-label="Select size">${lines.join('')}</div>`;
}

function renderQuantitySelect(product) {
  const opts = [];
  for (let i = 1; i <= 10; i++) {
    const sel = i === 1 ? ' selected' : '';
    opts.push(`<option value="${i}"${sel}>${i}</option>`);
  }
  return (
    `<div class="quantity-selector">` +
    `<label for="qty-${escapeHtml(product.id)}">Quantity:</label> ` +
    `<select id="qty-${escapeHtml(product.id)}" name="quantity" min="1" max="10" required>` +
    opts.join('') + `</select></div>`
  );
}

function renderAddToCartBtn(product) {
  return `<button type="submit">Add to Cart</button>`;
}

function renderProductCard(product, selectedOption) {
  const opt = selectedOption || product.options?.[0] || null;
  const displayPrice = opt ? opt.price : product.price;
  const optionRadios = renderOptionRadios(product, opt?.id);

  const imgAlt = escapeHtml(product.imageAlt || product.name);
  const imgSrc = escapeHtml(product.image || '');

  const stockText = product.inStock ? 'In Stock' : 'Out of Stock';
  const stockClass = product.inStock ? '' : ' out-of-stock';

  const featuredAttr = product.featured ? ' data-featured="true"' : '';

  const slugId = escapeHtml(product.slug || product.id);
  const anchorId = escapeHtml(product.id);

  return (
    `<a id="${slugId}" class="product-anchor slug-anchor" aria-hidden="true"></a>` +
    `<a id="${anchorId}-anchor" class="product-anchor"></a>` +
    `<article id="product-${anchorId}"${featuredAttr} class="product product-card" ` +
    `itemprop="itemListElement" itemscope itemtype="https://schema.org/Product" ` +
    `data-image="${escapeHtml(product.image || '')}" data-sku="${escapeHtml(product.sku || product.id)}">` +

    `<header class="media">` +
    `<figure class="product-gallery product-card__media">` +
    `<picture>` +
    `<source srcset="${imgSrc}" type="image/webp"> ` +
    `<img src="${imgSrc}" alt="${imgAlt}" width="300" height="300" loading="lazy" ` +
    `itemprop="image" class="u-img-cover">` +
    `</picture>` +
    `</figure>` +
    `<h3 itemprop="name">${escapeHtml(product.name)}</h3>` +
    `<div class="availability" itemprop="offers" itemscope itemtype="https://schema.org/Offer">` +
    `<link itemprop="availability" href="https://schema.org/InStock">` +
    `<meta itemprop="priceCurrency" content="AUD">` +
    `<p>${product.inStock ? '✓ ' : ''}<span itemprop="itemCondition">${stockText}</span></p>` +
    `</div>` +
    `</header>` +

    `<section class="product-description" itemprop="description">` +
    `<p>${escapeHtml(product.description)}</p>` +
    `</section>` +

    `<form action="/add-to-cart" method="post" class="product-options add-to-cart" ` +
    `data-product="${escapeHtml(product.id)}" data-sku="${escapeHtml(product.sku || product.id)}">` +
    `<fieldset>` +
    `<legend>Product Options</legend>` +
    optionRadios +
    renderQuantitySelect(product) +
    renderAddToCartBtn(product) +
    `</fieldset>` +
    `</form>` +

    `</article>`
  );
}

function renderGrid(container, products) {
  if (!products.length) {
    container.innerHTML = '<p>No products found.</p>';
    return;
  }
  container.innerHTML = products.map((p) => renderProductCard(p, p.options?.[0])).join('');
  attachOptionHandlers(container);
}

function attachOptionHandlers(container) {
  container.querySelectorAll('input[type="radio"][data-price]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const article = radio.closest('article');
      if (!article) return;
      const price = radio.dataset.price;
      const btn = article.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = price ? `Add to Cart — $${Number(price).toFixed(2)}` : 'Add to Cart';
      }
    });
  });
}

export async function initProductGrid(selector = '#product-grid') {
  const container =
    typeof document !== 'undefined'
      ? document.querySelector(selector)
      : null;
  if (!container) return;

  const ids = container.dataset.ids;
  const category = container.dataset.category;
  const products = await fetchProducts();
  const filtered = ids
    ? products.filter((p) => ids.split(',').includes(p.id))
    : category
      ? products.filter((p) => p.category === category)
      : products;

  renderGrid(container, filtered);
}

export async function renderProductsByIds(selector, ids) {
  const container =
    typeof document !== 'undefined'
      ? document.querySelector(selector)
      : null;
  if (!container) return;

  const products = await fetchProducts();
  const filtered = ids
    ? products.filter((p) => ids.includes(p.id))
    : products;

  renderGrid(container, filtered);
}
