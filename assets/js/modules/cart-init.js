/*
    cart-init.js
    Minimal cart initialisation using native browser APIs and small CartStore wrapper.

    Native APIs used:
    - Form handling: FormData, HTMLFormElement.submit()
    - Storage: localStorage (via storageLocal), IndexedDB (via storageIDB)
    - Events: addEventListener, CustomEvent (cart:updated)
    - DOM: querySelector, closest, dataset, classList
    - Service worker integration: navigator.serviceWorker / Background Sync (best-effort)

    Design goals: keep JS minimal and declarative; use a single delegated submit handler
    for add-to-cart forms to avoid duplicate listeners and ensure dynamic content works.
*/

import { parseWeightString } from './cartStore.js';
import {
  updateCartCountOutputs,
  renderCartTable,
  setProductIndex,
  displayShippingEstimate,
  updateCartTableTotalsWithShipping,
} from './cartUI.js';
import { requestBackgroundSync } from './sync.js';

// Configurable debug flag for shipping estimator logging
const DEBUG_SHIPPING = false;

// Shared utility: calculate total weight from cart items using product index
function calculateTotalWeight(cartItems, productIndex) {
  let totalGrams = 0;
  (cartItems || []).forEach((it) => {
    let weightPerItem = 0;
    if (productIndex && it.id && (productIndex[it.id] || productIndex[it.sku])) {
      const prod = productIndex[it.id] || productIndex[it.sku];
      // Prefer explicit option match
      if (it.size && Array.isArray(prod.options)) {
        const opt = prod.options.find((o) => o.id === it.size || o.label === it.size);
        if (opt && opt.weight) weightPerItem = parseWeightString(opt.weight);
      }
      // Fallback: product-level option or first option
      if (!weightPerItem && Array.isArray(prod.options) && prod.options.length) {
        const opt0 = prod.options[0];
        if (opt0 && opt0.weight) weightPerItem = parseWeightString(opt0.weight);
      }
      // Fallback: product-level weight field
      if (!weightPerItem && prod.weight) weightPerItem = parseWeightString(prod.weight);
    }
    // Final fallback: assume 50 grams per item
    if (!weightPerItem) weightPerItem = 50;
    const qty = parseInt(it.quantity, 10) || 0;
    totalGrams += weightPerItem * qty;
  });
  return totalGrams;
}

// Parse a price-like string into a numeric value (robust to currency symbols and comma decimals)
function parsePriceString(val) {
  if (val == null) return null;
  const s = String(val).trim().replace(/[^\d.,-]/g, '').replace(/,/g, '.');
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

// Return selected option price (Number) by inspecting common control names inside the form
function getSelectedOptionPrice(form, productEl) {
  if (!form) return null;
  const names = ['size', 'package', 'variant', 'option', 'format'];
  for (const name of names) {
    // radios / checkboxes
    const checked = form.querySelector(`input[name='${name}']:checked`);
    if (checked) {
      if (checked.dataset && checked.dataset.price) {
        const p = parsePriceString(checked.dataset.price);
        if (p !== null) return p;
      }
      if (checked.value) {
        const p = parsePriceString(checked.value);
        if (p !== null) return p;
        if (productEl) {
          const m = productEl.querySelector(`[data-price][data-value='${checked.value}']`);
          if (m && m.dataset.price) {
            const p2 = parsePriceString(m.dataset.price);
            if (p2 !== null) return p2;
          }
        }
      }
    }
    // select
    const sel = form.querySelector(`select[name='${name}']`);
    if (sel && sel.selectedOptions && sel.selectedOptions.length) {
      const opt = sel.selectedOptions[0];
      if (opt.dataset && opt.dataset.price) {
        const p = parsePriceString(opt.dataset.price);
        if (p !== null) return p;
      }
      if (opt.value) {
        const p = parsePriceString(opt.value);
        if (p !== null) return p;
      }
    }
  }

  // fallback: any checked input within the form with data-price
  const any = form.querySelector('input:checked[data-price]');
  if (any && any.dataset && any.dataset.price) {
    const p = parsePriceString(any.dataset.price);
    if (p !== null) return p;
  }

  return null;
}

// initCart - centralised cart initialiser extracted from app.js
export async function initCart() {
  const cartStore = window.CartStore;
  if (cartStore && typeof cartStore.init === 'function') await cartStore.init();

  // load canonical product index (best-effort). We expose it to cart UI so rendering prefers it.
  // `idx` is declared in outer scope so other functions (estimator) can reference it safely.
  let idx = null;
  try {
    const res = await fetch('/assets/js/data/products.json', { cache: 'no-store' });
    if (res && res.ok) {
      const payload = await res.json();
      const list = Array.isArray(payload) ? payload : payload.products || [];
      idx = {};
      list.forEach((p) => {
        if (p && p.id) idx[p.id] = p;
        if (p && p.sku) idx[p.sku] = p;
      });
      setProductIndex(idx);
    }
  } catch (e) {
    // ignore errors; fallback to per-page data attributes
  }

  // initial UI render
  const cart = cartStore.get();
  updateCartCountOutputs(
    (cart.items || []).reduce((s, it) => s + (parseInt(it.quantity, 10) || 0), 0)
  );
  renderCartTable(cart);
  // Shipping rate in AUD (excl GST & fuel surcharge). Updated by estimator.
  let currentShippingRate = 0;
  // Ensure totals include current shipping (initially 0)
  updateCartTableTotalsWithShipping(currentShippingRate);

  // Optional: Shared cart synchronization across tabs
  try {
    // Lazy-import the client to keep no-JS and small bundles lean
    const sc = await import('./shared-cart-client.js');
    const client = sc && sc.createClient ? sc.createClient() : null;
    if (client) {
      // When the shared worker sends the canonical cart, replace local store and re-render
      client.on(async (msg) => {
        if (!msg) return;
        if (msg.event === 'CART' || msg.event === 'CART_UPDATED') {
          try {
            if (msg.cart) {
              // Overwrite local cart with canonical copy and persist via global CartStore
              try { await window.CartStore.set(msg.cart); } catch (e) { window.CartStore.set && window.CartStore.set(msg.cart); }
              const c = window.CartStore.get();
              updateCartCountOutputs((c.items || []).reduce((s, it) => s + (parseInt(it.qty || it.quantity || 0,10)||0), 0));
              renderCartTable(c);
              updateCartTableTotalsWithShipping(currentShippingRate);
            }
          } catch (err) { console.warn('Failed to apply shared cart update', err); }
        }
      });

      // When local cart changes, push to shared worker
      document.addEventListener('cart:updated', () => {
        try {
          const c = window.CartStore.get();
          client.setCart(c, 'cart-init');
        } catch (err) { console.warn('Failed to push cart to shared worker', err); }
      });

      // Push current cart on load (idempotent)
      try { client.setCart(window.CartStore.get(), 'cart-init'); } catch (e) {}
    }
  } catch (e) {
    // dynamic import may fail on older browsers — ignore for progressive enhancement
  }

  // Delegated submit handler for add-to-cart forms (uses native FormData)
  document.addEventListener('submit', async (ev) => {
    const form = ev.target;
    if (!form || !form.matches || !form.matches('form.add-to-cart, form.product-options')) return;
    ev.preventDefault();
    try {
      const fd = new FormData(form);
      // Prefer explicit component-root attribute first, then legacy selectors
    const productEl =
      form.closest('article[data-sku]') ||
      form.closest('[data-product]') ||
      form.closest('.product') ||
      form.closest('[itemscope]') ||
      form;
      const id =
        productEl && (productEl.id || productEl.dataset.sku || productEl.dataset.id)
          ? productEl.id || productEl.dataset.sku || productEl.dataset.id
          : `i_${Math.random().toString(36).slice(2, 9)}`;
      // Prefer explicit product title attribute then fall back to legacy heading selectors
      const nameEl =
        productEl &&
        (productEl.querySelector('[data-product-title]') ||
          productEl.querySelector('[data-product-name]') ||
          productEl.querySelector('[itemprop="name"]') ||
          productEl.querySelector('h3, h2, .product-title'));
      const name = nameEl ? nameEl.textContent.trim() : fd.get('name') || 'Item';
      let size = fd.get('size') || fd.get('package') || '';
      const quantity = parseInt(fd.get('quantity') || fd.get('qty') || 1, 10) || 1;

      // price extraction (prefer selected option price, fallback to product-level data-price)
      let price = null;
      // First try an explicit per-option price from selected controls (radios/selects)
      const selPrice = getSelectedOptionPrice(form, productEl);
      if (selPrice !== null) {
        price = selPrice;
      } else {
        // Fallback: if FormData has an option value, try to find the control by value
        const candidateVal = fd.get('package') || fd.get('size') || fd.get('variant') || fd.get('option') || fd.get('format') || '';
        if (candidateVal) {
          // Try to find an input/select option matching the value for known option names
          const names = ['size', 'package', 'variant', 'option', 'format'];
          for (const n of names) {
            if (price !== null) break;
            const valEl = form.querySelector(`input[name="${n}"][value="${candidateVal}"]`);
            if (valEl && valEl.dataset && valEl.dataset.price) {
              const p = parsePriceString(valEl.dataset.price);
              if (p !== null) {
                price = p;
                break;
              }
            }
            const optEl = form.querySelector(`select[name="${n}"] option[value="${candidateVal}"]`);
            if (optEl && optEl.dataset && optEl.dataset.price) {
              const p2 = parsePriceString(optEl.dataset.price);
              if (p2 !== null) {
                price = p2;
                break;
              }
            }
          }
        }

        // Still no per-option price found? Fallback to first product-level data-price or itemprop
        if (price === null) {
          // Check for explicit product price attributes first, then legacy itemprop
          const priceField =
            productEl &&
            (productEl.querySelector('[data-product-price]') || productEl.querySelector('[data-price]') || productEl.querySelector('[itemprop="price"]'));
          if (priceField) {
            // read dataset.price, dataset.productPrice, content attribute, or fallback to text content
            price =
              parsePriceString(
                priceField.dataset.price || priceField.dataset.productPrice || priceField.getAttribute('content') || priceField.textContent
              ) || null;
          }
        }

        // Debugging aid: when running locally, log the decision tree so we can see why the cylinder price wasn't used.
        try {
          if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            let productLevelPrice = null;
            try {
              const pf = productEl && (productEl.querySelector('[data-price]') || productEl.querySelector('[itemprop="price"]'));
              if (pf) {
                productLevelPrice = (pf.dataset && pf.dataset.price) ? pf.dataset.price : (pf.getAttribute && pf.getAttribute('content')) || null;
              }
            } catch (e) {
              productLevelPrice = null;
            }

            // Determine if there is a mismatch between the form's checked package and the candidateVal
            let fallbackMismatchLocal = false;
            try {
              const checkedPkg = form.querySelector('input[name="package"]:checked');
              if (candidateVal && checkedPkg && String(checkedPkg.value) !== String(candidateVal)) {
                fallbackMismatchLocal = true;
              }
            } catch (e) {
              // ignore
            }

            console.debug('Add-to-cart debug:', {
              id,
              fdPackage: fd.get('package'),
              fdSize: fd.get('size'),
              selPriceFound: selPrice,
              candidateVal,
              matchedInput: (candidateVal && form.querySelector(`input[value="${candidateVal}"]`)) ? true : false,
              matchedInputPrice: (candidateVal && form.querySelector(`input[value="${candidateVal}"]`) && form.querySelector(`input[value="${candidateVal}"]`).dataset) ? form.querySelector(`input[value="${candidateVal}"]`).dataset.price : null,
              finalPrice: price,
              productLevelPrice,
              fallbackMismatch: fallbackMismatchLocal,
            });
          }
        } catch (e) {
          // ignore debug logging errors
        }
      }
        // Debug: detect when a candidate value was present but the form's checked control doesn't match it
        let fallbackMismatch = false;
        try {
          const checkedPkg = form.querySelector('input[name="package"]:checked');
          if (price !== null && candidateVal && checkedPkg && String(checkedPkg.value) !== String(candidateVal)) {
            fallbackMismatch = true;
          }
        } catch (e) {
          // ignore minor DOM errors during debug checks
        }

        if (false && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && fallbackMismatch) {
          // left intentionally disabled - use console.debug earlier instead of spurious warnings in prod local logs
          console.warn('Pricing fallback used for product', id, 'selected:', candidateVal, 'priceUsed:', price);
        }

      // image extraction using data attributes or first <img>
      let image = null;
      if (productEl) {
        if (productEl.dataset && (productEl.dataset.image || productEl.dataset.productImage))
          image = productEl.dataset.image || productEl.dataset.productImage;
        const imgByItem = productEl.querySelector('img[itemprop="image"], img[data-product-image]');
        if (!image && imgByItem)
          image = imgByItem.currentSrc || imgByItem.src || imgByItem.getAttribute('src');
        if (!image) {
          const firstImg = productEl.querySelector('img');
          if (firstImg) image = firstImg.currentSrc || firstImg.src || firstImg.getAttribute('src');
        }
      }
      if (image && image.startsWith('./')) image = image.replace('./', '/');

      // sku and description
      const sku =
        (productEl &&
          (productEl.dataset.sku ||
            productEl.dataset.productSku ||
            productEl.getAttribute && productEl.getAttribute('data-sku') ||
            (productEl.querySelector && productEl.querySelector('[itemprop="sku"]') && productEl.querySelector('[itemprop="sku"]').textContent.trim()))) ||
        null;
      const descriptionEl =
        productEl &&
        (productEl.querySelector('[itemprop="description"]') ||
          productEl.querySelector('.product-description, p'));
      const description = descriptionEl ? descriptionEl.textContent.trim().slice(0, 160) : '';

      // Prefer canonical price from product index to avoid DOM tampering.
      // When an option radio is selected, match its value against the product options array
      // so the correct per-option price (e.g. $22 for 70 g cylinder) is used rather than
      // the base product price ($14).
      try {
        if ((typeof idx !== 'undefined' && idx) && (sku || id)) {
          const prod = idx[String(sku)] || idx[String(id)];
          if (prod) {
            const checkedInput = form.querySelector(
              'input[type="radio"]:checked, input[type="checkbox"]:checked'
            );
            const optionValue = checkedInput ? String(checkedInput.value) : null;
            let matchedOpt = null;
            if (optionValue && Array.isArray(prod.options)) {
              matchedOpt = prod.options.find((o) => String(o.id) === optionValue);
            }
            if (matchedOpt) {
              if (matchedOpt.price != null) price = Number(matchedOpt.price);
              // Populate size from the option label when not already set by a named field
              if (!size && matchedOpt.label) size = matchedOpt.label;
            } else if (prod.price != null) {
              price = Number(prod.price);
            }
          }
        }
      } catch (e) {
        // ignore and fall back to detected price
      }

      await window.CartStore.add({ id, name, size, quantity, price, image, sku, description });
      const updated = window.CartStore.get();
      updateCartCountOutputs(
        (updated.items || []).reduce((s, it) => s + (parseInt(it.quantity ?? it.qty, 10) || 0), 0)
      );
      renderCartTable(updated);
      // Keep totals in sync with the latest shipping rate
      updateCartTableTotalsWithShipping(currentShippingRate);
      // Dispatch a custom event for other scripts to listen to
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: updated } }));
      // best-effort background sync registration
      requestBackgroundSync('sync-cart').catch((err) => {
        console.error('Background sync registration failed:', err);
      });
    } catch (e) {
      console.error('Error processing add-to-cart form:', e);
    }
  });

  // cart page interactions: attach a delegated submit handler for #cart-form.
  // We use document-level delegation so the handler works even when this module
  // executes before the DOM is parsed (scripts in <head> as type=module). This
  // mirrors the add-to-cart delegated approach used earlier.
  document.addEventListener('submit', async (ev) => {
    const form = ev.target;
    if (!(form && form.id === 'cart-form')) return;
    ev.preventDefault();
    const rows = Array.from(form.querySelectorAll('tbody tr'));
    // sequentially update quantities using CartStore.updateQuantity
    for (const row of rows) {
      const qtyEl = row.querySelector('input[type="number"]');
      const pid = row.dataset.productId;
      const size = row.dataset.productSize !== undefined ? row.dataset.productSize : row.dataset.size || '';
      const newQty = qtyEl ? (parseInt(qtyEl.value, 10) || 0) : 0;
      if (pid && newQty >= 0) {
        await window.CartStore.updateQuantity(pid, newQty, size);
      }
    }
    const c = window.CartStore.get();
    updateCartCountOutputs((c.items || []).reduce((s, it) => s + (parseInt(it.qty || it.quantity, 10) || 0), 0));
    renderCartTable(c);
    // Keep totals in sync after quantity updates
    updateCartTableTotalsWithShipping(currentShippingRate);

    // Re-run shipping estimator with current postcode and cart
    const postcodeEl = document.getElementById('checkout-postcode');
    if (postcodeEl) {
      const pc = postcodeEl.value;
      const totalGrams = calculateTotalWeight(c.items, idx);
      displayShippingEstimate(pc, null, {
        storeState: 'WA',
        storePostcode: '6147',
        totalWeight: totalGrams,
      });
    }
  });

  // Global delegated handler so remove buttons work even if the cart table
  // is dynamically created or not inside a #cart-form element.

  // Helper function to find the remove button from an event target
  function findRemoveButton(target) {
    if (!target) return null;
    if (typeof target.matches === 'function' && target.matches('.remove-item')) {
      return target;
    }
    if (typeof target.closest === 'function') {
      return target.closest('.remove-item');
    }
    return null;
  }

  document.addEventListener('click', async (ev) => {
    const btn = findRemoveButton(ev.target);
    if (!btn) return;
    // Find the row and product id
    const row = btn.closest && btn.closest('tr');
    const id = row && row.dataset && row.dataset.productId;
    const size =
      row &&
      (row.dataset.productSize !== undefined ? row.dataset.productSize : row.dataset.size || '');
    if (!id) return;
    try {
      await window.CartStore.remove(id, size);
      const c2 = window.CartStore.get();
      updateCartCountOutputs(
        (c2.items || []).reduce((s, it) => s + (parseInt(it.qty || it.quantity, 10) || 0), 0)
      );
      renderCartTable(c2);
      // update totals after removal
      updateCartTableTotalsWithShipping(currentShippingRate);
      // Notify listeners (e.g. shipping estimator) that the cart has changed
      document.dispatchEvent(
        new CustomEvent('cart:updated', { detail: { source: 'remove-item' } })
      );
    } catch (e) {
      console.error('Error removing cart item:', e);
    }
  });

  // Shipping estimator wiring: live postcode + total weight calculation
  // Debounce helper
  function debounce(fn, wait = 300) {
    let t = null;
    return function debounced(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Estimator listener attachment: run after DOM ready so elements exist.
  const runEstimate = async () => {
    const pcEl = document.getElementById('checkout-postcode');
    const pc = pcEl ? pcEl.value : '';
    // Calculate total weight from cart items using shared utility
    const cart = window.CartStore.get();
    const totalGrams = calculateTotalWeight(cart.items, idx);

    if (DEBUG_SHIPPING) {
      console.log(
        '[ShippingEstimator] postcode:',
        pc,
        'totalWeight:',
        totalGrams,
        'cart:',
        cart.items
      );
    }
    const res = await displayShippingEstimate(pc, null, {
      storeState: 'WA',
      storePostcode: '6147',
      totalWeight: totalGrams,
    });
    currentShippingRate = res && (res.totalRate || res.totalRate === 0) ? Number(res.totalRate) : 0;
    updateCartTableTotalsWithShipping(currentShippingRate);

    // Immediately save shipping to localStorage so checkout can read it directly
    if (currentShippingRate > 0 && typeof localStorage !== 'undefined') {
      try {
        const postcodeEl = document.getElementById('checkout-postcode');
        const postcode = postcodeEl ? postcodeEl.value.trim() : '';
        const cart = window.CartStore ? window.CartStore.get() : { items: [] };
        const shippingData = {
          items: cart.items || [],
          shipping: currentShippingRate,
          postcode: postcode
        };
        localStorage.setItem('naturesi_cart', JSON.stringify(shippingData));
      } catch (e) {
        console.warn('Failed to save shipping to localStorage:', e);
      }
    }

    const checkoutBtn = document.getElementById('btn-proceed-checkout');
    if (checkoutBtn) {
      if (currentShippingRate > 0) {
        checkoutBtn.removeAttribute('disabled');
        checkoutBtn.title = '';
      } else {
        checkoutBtn.setAttribute('disabled', 'true');
        checkoutBtn.title = 'Enter a postcode to calculate shipping';
      }
    }
  };

  const debouncedRun = debounce(runEstimate, 300);

  function attachEstimatorListeners() {
    const form = document.getElementById('shipping-estimator');
    const postcodeEl = document.getElementById('checkout-postcode');
    if (form) {
      // Prevent the estimator form from submitting (Enter key) which would reload the page
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
      });
    }
    if (postcodeEl) {
      postcodeEl.addEventListener('input', debouncedRun);
      // run initial estimate if value present
      if (postcodeEl.value && postcodeEl.value.trim()) {
        runEstimate().catch((err) => {
          console.warn('Initial shipping estimate failed:', err);
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachEstimatorListeners, { once: true });
  } else {
    attachEstimatorListeners();
  }

  // return the store so callers (app.js) can expose a debug API
  return window.CartStore;
}
