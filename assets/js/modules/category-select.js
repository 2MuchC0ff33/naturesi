// Attach change handler to the site category select to navigate to store pages
const INIT_DATA_ATTR = 'categorySelectInit';

export function buildCategoryUrl(val) {
  return val ? `/pages/store/${encodeURIComponent(val)}.html` : '/pages/store.html';
}

// Exported navigation helper (default behaviour uses location.assign)
export function navigateTo(url) {
  if (typeof window !== 'undefined' && window.location && typeof window.location.assign === 'function') {
    window.location.assign(url);
  } else if (typeof location !== 'undefined' && typeof location.assign === 'function') {
    location.assign(url);
  }
}

export function initCategorySelect(
  documentRoot = typeof document !== 'undefined' ? document : null,
  navigator = navigateTo
) {
  if (!documentRoot) return;
  const sel = documentRoot.getElementById('site-category-select');
  if (!sel) return;
  // Prevent double initialization
  if (sel.dataset && sel.dataset[INIT_DATA_ATTR]) return;
  sel.dataset[INIT_DATA_ATTR] = '1';

  sel.addEventListener('change', function () {
    // Map value to a store page, default to /pages/store.html
    const val = this.value;
    const url = buildCategoryUrl(val);
    // Delegate navigation to a helper for easier testing and potential progressive enhancement
    navigator(url);
  });

  // Also allow Enter key to trigger navigation for some keyboard flows
  sel.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') {
      const url = buildCategoryUrl(this.value);
      navigator(url);
    }
  });
}

// Auto-run in browser contexts if module is imported directly
if (typeof document !== 'undefined') {
  try {
    initCategorySelect(document);
  } catch (e) {
    // silent fail to avoid noisy logs in environments without the select
  }
}
