h28825
s 00220/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
// Cart UI helpers: update header count outputs and render cart table
let PRODUCT_INDEX = null;

// Shipping UI helpers: display shipping estimate in the cart summary
import { calculateParcelRate, calculateShippingByWeight } from './cartStore.js';

export function setProductIndex(index) {
  PRODUCT_INDEX = index;
}

export function updateCartCountOutputs(total) {
  document.querySelectorAll('output[name="cart-count"]').forEach((out) => {
    out.textContent = total;
    out.value = String(total);
  });
}

export function renderCartTable(cart) {
  // If the DOM is still parsing, defer rendering until DOMContentLoaded to avoid
  // creating a placeholder table prematurely (scripts are loaded as type=module in <head>).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderCartTable(cart), { once: true });
    return;
  }

  const tbody = document.querySelector('.cart-table tbody');
  if (!tbody) {
    // If the table element exists but no tbody, create a tbody and re-run render.
    const table = document.querySelector('.cart-table');
    if (table) {
      const newTbody = document.createElement('tbody');
      table.appendChild(newTbody);
      // call again now that tbody exists
      renderCartTable(cart);
      return;
    }

    // If no cart table is present in the DOM, skip rendering quietly.
    // This avoids noisy console messages on pages that don't include a cart table.
    return;
  }
  tbody.innerHTML = '';
  (cart.items || []).forEach((it) => {
    const tr = document.createElement('tr');
    tr.dataset.productId = it.id;
    // expose the item's selected size on the row so delegated handlers can remove the
    // correct item when multiple sizes/options exist. Keep as empty string when
    // not provided (matches how items are created elsewhere).
    tr.dataset.productSize = it.size || '';
    // Build row markup safely using DOM methods (auto-escapes text content)
    const sku = it.sku ? String(it.sku) : '';
    const priceVal = it.price || 0;
    const qtyVal = it.quantity || 1;

    // Build table row safely using DOM methods
    // 1st cell: product info
    const tdInfo = document.createElement('td');
    const figure = document.createElement('figure');
    figure.className = 'cart-item';
    const figcaption = document.createElement('figcaption');
    const strong = document.createElement('strong');
    strong.textContent = it.name || '';
    figcaption.appendChild(strong);
    const divMuted = document.createElement('div');
    divMuted.className = 'muted';
    let skuSizeText = '';
    if (sku) skuSizeText += sku;
    if (sku && it.size) skuSizeText += ' · ';
    if (it.size) skuSizeText += it.size;
    divMuted.textContent = skuSizeText;
    figcaption.appendChild(divMuted);
    const pDesc = document.createElement('p');
    pDesc.className = 'cart-item-desc';
    pDesc.textContent = it.description || '';
    figcaption.appendChild(pDesc);
    figure.appendChild(figcaption);
    tdInfo.appendChild(figure);
    tr.appendChild(tdInfo);

    // 2nd cell: unit price
    const tdPrice = document.createElement('td');
    const spanPrice = document.createElement('span');
    spanPrice.className = 'unit-price';
    const priceStr = priceVal.toFixed ? priceVal.toFixed(2) : String(priceVal);
    spanPrice.setAttribute('data-price', priceStr);
    spanPrice.textContent = `AUD $${priceStr}`;
    tdPrice.appendChild(spanPrice);
    tr.appendChild(tdPrice);

    // 3rd cell: quantity input
    const tdQty = document.createElement('td');
    const labelQty = document.createElement('label');
    labelQty.className = 'visually-hidden';
    labelQty.textContent = `Quantity for ${it.name || ''}`;
    tdQty.appendChild(labelQty);
    const inputQty = document.createElement('input');
    inputQty.type = 'number';
    inputQty.min = '1';
    inputQty.max = '99';
    inputQty.value = String(qtyVal);
    inputQty.setAttribute('inputmode', 'numeric');
    tdQty.appendChild(inputQty);
    tr.appendChild(tdQty);

    // 4th cell: line total
    const tdLineTotal = document.createElement('td');
    const spanLineTotal = document.createElement('span');
    spanLineTotal.className = 'line-total';
    const lineTotal = ((parseFloat(priceVal) || 0) * (parseInt(qtyVal, 10) || 1)).toFixed(2);
    spanLineTotal.textContent = `AUD $${lineTotal}`;
    tdLineTotal.appendChild(spanLineTotal);
    tr.appendChild(tdLineTotal);

    // 5th cell: remove button
    const tdRemove = document.createElement('td');
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'remove-item';
    btnRemove.setAttribute('aria-label', `Remove ${it.name || ''} from cart`);
    btnRemove.textContent = 'Remove';
    tdRemove.appendChild(btnRemove);
    tr.appendChild(tdRemove);
    tbody.appendChild(tr);
  });
  updateCartTableTotals();
}

/**
 * Update cart table line totals and summary subtotal.
 * Iterates through cart rows, calculates line totals, and updates the summary.
 * Stores the subtotal in a data-subtotal attribute for reliable retrieval.
 * @returns {number} The calculated subtotal value.
 */
export function updateCartTableTotals() {
  const rows = document.querySelectorAll('.cart-table tbody tr');
  let subtotal = 0;
  rows.forEach((row) => {
    const unit = row.querySelector('.unit-price');
    const qty = row.querySelector('input[type="number"]');
    const line = row.querySelector('.line-total');
    const price = unit
      ? parseFloat((unit.dataset.price || '').toString()) ||
        parseFloat(unit.textContent.replace(/[^0-9.]/g, '')) ||
        0
      : 0;
    const q = qty ? parseInt(qty.value, 10) || 0 : 0;
    const total = price * q || 0;
    if (line) line.textContent = `AUD $${total.toFixed(2)}`;
    subtotal += total;
  });
  const subEl = document.getElementById('summary-subtotal');
  const totalEl = document.getElementById('summary-total');
  if (subEl) {
    subEl.textContent = `AUD $${subtotal.toFixed(2)}`;
    // Store subtotal as data attribute for reliable retrieval by other functions
    subEl.dataset.subtotal = subtotal.toFixed(2);
  }
  // Update total as subtotal (shipping = 0 by default in this context)
  if (totalEl) totalEl.textContent = `AUD $${subtotal.toFixed(2)}`;
  return subtotal;
}

/**
 * Update the cart total with shipping cost.
 * Accepts optional subtotal parameter to avoid parsing DOM text.
 * Fallback chain: parameter → data-subtotal attribute → parse text content.
 * @param {number} [shipping=0] - The shipping cost to add to the subtotal.
 * @param {number|null} [subtotal=null] - Optional subtotal value. If not provided, reads from data attribute or DOM.
 */
export function updateCartTableTotalsWithShipping(shipping = 0, subtotal = null) {
  const subEl = document.getElementById('summary-subtotal');
  const totalEl = document.getElementById('summary-total');
  // Prefer parameter, then data attribute, then parse text as fallback
  let sub = subtotal;
  if (sub === null && subEl && subEl.dataset.subtotal) {
    sub = parseFloat(subEl.dataset.subtotal) || 0;
  } else if (sub === null && subEl) {
    sub = parseFloat((subEl.textContent || '').replace(/[^0-9.]/g, '')) || 0;
  }
  sub = sub || 0;
  const total = sub + (parseFloat(shipping) || 0);
  if (totalEl) totalEl.textContent = `AUD $${total.toFixed(2)}`;
}

// Display a shipping estimate for a given postcode and parcel type.
// parcelType should match keys in `assets/js/data/postage.json` (e.g. 'satchel').
export async function displayShippingEstimate(postcode, parcelType, opts = {}) {
  const el = document.getElementById('summary-shipping');
  if (!el) return null;

  if (!postcode) {
    el.textContent = 'Calculated at checkout';
    return null;
  }

  try {
    // If totalWeight is provided, compute shipping based on weight; otherwise use parcelType
    if (opts && opts.totalWeight) {
      const res = await calculateShippingByWeight(opts.totalWeight, postcode, opts);
      if (!res || res.totalRate === null || Number.isNaN(res.totalRate)) {
        el.textContent = 'Calculated at checkout';
        return null;
      }
      el.textContent = `AUD $${Number(res.totalRate).toFixed(2)} (Type: ${res.parcelType}, Zone: ${res.zone})`;
      return res;
    }

    const res = await calculateParcelRate(parcelType, postcode, opts);
    if (!res || res.rate === null || Number.isNaN(res.rate)) {
      el.textContent = 'Calculated at checkout';
      return null;
    }
    el.textContent = `AUD $${res.rate.toFixed(2)} (Zone: ${res.zone})`;
    return res;
  } catch (err) {
    console.error('Error calculating shipping estimate', err);
    el.textContent = 'Calculated at checkout';
    return null;
  }
}
E 1
