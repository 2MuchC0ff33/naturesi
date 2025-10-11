// Cart UI helpers: update header count outputs and render cart table
export function updateCartCountOutputs(total) {
    document.querySelectorAll('output[name="cart-count"]').forEach((out) => {
        out.textContent = total;
        out.value = String(total);
    });
}

export function renderCartTable(cart) {
    const tbody = document.querySelector('.cart-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (cart.items || []).forEach((it) => {
        const tr = document.createElement('tr');
        tr.dataset.productId = it.id;
        // Build row markup safely
        let imgSrc = it.image || '';
        // Heuristic fallback: try to resolve by sku or id to an image in assets/img
        if (!imgSrc) {
            const candidate = it.sku || it.id || '';
            if (candidate) {
                // normalise candidate -> simple filename
                const fname = candidate.toString().toLowerCase().replace(/[^a-z0-9-]/g, '') + '.webp';
                imgSrc = `/assets/img/${fname}`;
            }
        }
        if (!imgSrc) imgSrc = '/assets/img/placeholder-product.webp';
        const escapedName = String(it.name || '').replace(/</g, '&lt;');
        const desc = String(it.description || '').replace(/</g, '&lt;');
        const sku = it.sku ? String(it.sku).replace(/</g, '&lt;') : '';
        const priceVal = (it.price || 0);
        const qtyVal = (it.quantity || 1);

        tr.innerHTML = `
      <td>
        <figure class="cart-item">
          <img src="${imgSrc}" alt="${escapedName}" width="64" height="64" loading="lazy" onerror="this.src='/assets/img/placeholder-product.webp'">
          <figcaption>
            <strong>${escapedName}</strong>
            <div class="muted">${sku}${sku && it.size ? ' · ' : ''}${it.size || ''}</div>
            <p class="cart-item-desc">${desc}</p>
          </figcaption>
        </figure>
      </td>
      <td><span class="unit-price" data-price="${priceVal.toFixed ? priceVal.toFixed(2) : priceVal}">AUD $${priceVal.toFixed ? priceVal.toFixed(2) : priceVal}</span></td>
      <td><label class="visually-hidden">Quantity for ${escapedName}</label><input type="number" min="1" max="99" value="${qtyVal}" inputmode="numeric"></td>
      <td><span class="line-total">AUD $${(((parseFloat(priceVal) || 0) * (parseInt(qtyVal, 10) || 1))).toFixed(2)}</span></td>
      <td><button type="button" class="remove-item" aria-label="Remove ${escapedName} from cart">Remove</button></td>
    `;

        tbody.appendChild(tr);
    });
    updateCartTableTotals();
}

export function updateCartTableTotals() {
    const rows = document.querySelectorAll('.cart-table tbody tr');
    let subtotal = 0;
    rows.forEach((row) => {
        const unit = row.querySelector('.unit-price');
        const qty = row.querySelector('input[type="number"]');
        const line = row.querySelector('.line-total');
        const price = unit ? parseFloat((unit.dataset.price || '').toString()) || parseFloat(unit.textContent.replace(/[^0-9\.]/g, '')) || 0 : 0;
        const q = qty ? parseInt(qty.value, 10) || 0 : 0;
        const total = (price * q) || 0;
        if (line) line.textContent = `AUD $${total.toFixed(2)}`;
        subtotal += total;
    });
    const subEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    if (subEl) subEl.textContent = `AUD $${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `AUD $${subtotal.toFixed(2)}`;
}
