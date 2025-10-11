// Cart UI helpers: update header count outputs and render cart table
let PRODUCT_INDEX = null;

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
    const tbody = document.querySelector('.cart-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (cart.items || []).forEach((it) => {
        const tr = document.createElement('tr');
        tr.dataset.productId = it.id;
        // Build row markup safely
        // Prefer canonical product index metadata when available
        let imgSrc = '';
        let canonical = null;
        if (PRODUCT_INDEX && it.id) canonical = PRODUCT_INDEX[it.id] || PRODUCT_INDEX[it.sku] || null;
        if (canonical && canonical.image) imgSrc = canonical.image;
        if (!imgSrc && it.image) imgSrc = it.image;
        // Heuristic fallback: try to resolve by sku or id to an image in assets/img
        if (!imgSrc) {
            const candidate = it.sku || it.id || '';
            if (candidate) {
                // normalise candidate -> simple filename
                const fname = candidate.toString().toLowerCase().replace(/[^a-z0-9-]/g, '') + '.webp';
                imgSrc = `/assets/img/${fname}`;
            }
        }
        const escapedName = String(it.name || '').replace(/</g, '&lt;');
        const desc = String(it.description || '').replace(/</g, '&lt;');
        const sku = it.sku ? String(it.sku).replace(/</g, '&lt;') : '';
        const priceVal = (it.price || 0);
        const qtyVal = (it.quantity || 1);

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
        const lineTotal = (((parseFloat(priceVal) || 0) * (parseInt(qtyVal, 10) || 1))).toFixed(2);
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
