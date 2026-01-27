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

  // Progressive enhancement: create accessible tabs from the select for keyboard and visual users
  try {
    initCategoryTabs(documentRoot, navigator);
  } catch (e) {
    // Fail silently to avoid affecting non-supporting environments
  }
}

export function initCategoryTabs(documentRoot = typeof document !== 'undefined' ? document : null, navigator = navigateTo) {
  if (!documentRoot) return;
  const sel = documentRoot.getElementById('site-category-select');
  const container = documentRoot.getElementById('category-tabs-container');
  if (!sel || !container) return;
  // Build tab list from select options
  const options = Array.from(sel.options);
  if (!options.length) return;

  const tabList = document.createElement('div');
  tabList.className = 'tabs__list';
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', 'Product categories');

  let firstTab = null;
  options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tabs__tab';
    btn.textContent = opt.textContent;
    btn.dataset.value = opt.value || '';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('tabindex', '-1');
    if (index === 0) {
      // choose the "All categories" option as initial focusable element
      btn.setAttribute('tabindex', '0');
      firstTab = btn;
    }

    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      const url = buildCategoryUrl(value);
      navigator(url);
    });

    // Manage selected state when focused or clicked
    const setSelected = (target) => {
      const tabs = tabList.querySelectorAll('.tabs__tab');
      tabs.forEach((t) => {
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      target.setAttribute('aria-selected', 'true');
      target.setAttribute('tabindex', '0');
    };

    btn.addEventListener('focus', (ev) => {
      setSelected(ev.currentTarget);
    });

    // keyboard nav: left/right/home/end
    btn.addEventListener('keydown', (ev) => {
      const key = ev.key;
      let current = ev.currentTarget;
      if (!current) return;
      if (key === 'ArrowRight' || key === 'Right') {
        ev.preventDefault();
        const next = current.nextElementSibling || tabList.firstElementChild;
        if (next) next.focus();
      }
      if (key === 'ArrowLeft' || key === 'Left') {
        ev.preventDefault();
        const prev = current.previousElementSibling || tabList.lastElementChild;
        if (prev) prev.focus();
      }
      if (key === 'Home') {
        ev.preventDefault();
        tabList.firstElementChild && tabList.firstElementChild.focus();
      }
      if (key === 'End') {
        ev.preventDefault();
        tabList.lastElementChild && tabList.lastElementChild.focus();
      }
      if (key === 'Enter' || key === ' ') {
        ev.preventDefault();
        const value = current.dataset.value;
        const url = buildCategoryUrl(value);
        navigator(url);
      }
    });

    tabList.appendChild(btn);
  });

  // Insert built tab list into container and reveal it
  container.appendChild(tabList);
  container.removeAttribute('hidden');
  container.setAttribute('aria-hidden', 'false');

  // Mark header so CSS can hide the native select
  const header = documentRoot.getElementById('site-header');
  if (header) header.classList.add('has-category-tabs');

  // Simple focus management: ensure first tab is focusable and selected
  if (firstTab) {
    firstTab.setAttribute('tabindex', '0');
    firstTab.setAttribute('aria-selected', 'true');
  }
}


// Auto-run in browser contexts if module is imported directly
if (typeof document !== 'undefined') {
  try {
    initCategorySelect(document);
  } catch (e) {
    // silent fail to avoid noisy logs in environments without the select
  }
}
