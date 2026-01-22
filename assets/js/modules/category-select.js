// Attach change handler to the site category select to navigate to store pages
export function initCategorySelect(documentRoot = typeof document !== 'undefined' ? document : null) {
  if (!documentRoot) return;
  const sel = documentRoot.getElementById('site-category-select');
  if (!sel) return;
  sel.addEventListener('change', function () {
    // Map value to a store page, default to /pages/store.html
    const val = this.value;
    const url = val ? `/pages/store/${val}.html` : '/pages/store.html';
    window.location.href = url;
  });
}

// Auto-run in browser contexts
if (typeof document !== 'undefined') {
  try {
    initCategorySelect(document);
  } catch (e) {
    // silent fail
  }
}
