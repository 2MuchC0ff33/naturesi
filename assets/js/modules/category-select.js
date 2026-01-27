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
  // Explicitly mark orientation for assistive tech
  tabList.setAttribute('aria-orientation', 'horizontal');

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

      // Announce change to assistive tech if available (debounced by last value)
      try {
        if (container && container.__announcer) {
          const text = target.textContent.trim();
          if (container.__lastAnnounced !== text) {
            container.__announcer.textContent = `${text} selected`;
            container.__lastAnnounced = text;
          }
        }
      } catch (e) {
        // ignore announcer errors
      }
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

  // Mark header so CSS can hide the native select and disable it as a fallback
  const header = documentRoot.getElementById('site-header');
  if (header) {
    header.classList.add('has-category-tabs');
    try {
      // Hide and disable the native select explicitly to prevent it from capturing focus or clicks
      sel.setAttribute('aria-hidden', 'true');
      sel.setAttribute('tabindex', '-1');
      sel.disabled = true;
    } catch (e) {
      // ignore errors - best-effort enhancement
    }
  }

  // Simple focus management: ensure the tab that matches the current URL is selected
  // This improves discoverability when the user lands directly on a category page.
  try {
    const path = (typeof location !== 'undefined' && location.pathname) ? location.pathname : '';
    let currentCategory = '';
    if (path.includes('/pages/store/')) {
      // /pages/store/green-tea.html -> 'green-tea'
      const seg = path.replace(/\/$/, '').split('/').pop() || '';
      if (seg && seg.endsWith('.html')) currentCategory = seg.replace(/\.html$/, '');
    } else if (path.endsWith('/pages/store.html')) {
      try {
        const params = new URLSearchParams(location.search);
        currentCategory = params.get('category') || '';
      } catch (e) {
        currentCategory = '';
      }
    }

    let selectedTab = null;
    if (currentCategory !== '') {
      selectedTab = tabList.querySelector(`.tabs__tab[data-value="${currentCategory}"]`);
    }
    // fallback: try to match label text (some pages may use friendly names)
    if (!selectedTab && currentCategory) {
      selectedTab = Array.from(tabList.querySelectorAll('.tabs__tab')).find(t => t.textContent.toLowerCase().includes(currentCategory.replace(/-/g,' ').toLowerCase()));
    }

    // Final fallback is the first tab (All categories)
    const tabs = tabList.querySelectorAll('.tabs__tab');
    const defaultTab = tabs && tabs.length ? tabs[0] : null;
    const tabToSelect = selectedTab || defaultTab || firstTab;

    if (tabToSelect) {
      // Set selection and make it focusable
      tabList.querySelectorAll('.tabs__tab').forEach((t) => {
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      tabToSelect.setAttribute('aria-selected', 'true');
      tabToSelect.setAttribute('tabindex', '0');
      // If the selected tab is off-screen on small devices, ensure it's visible.
      // Respect users who prefer reduced motion.
      try {
        const prefersReduced = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        tabToSelect.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
      } catch (e) {
        try { tabToSelect.scrollIntoView({block: 'nearest', inline: 'center'}); } catch (err) { /* ignore */ }
      }
    }
  } catch (e) {
    // do not let enhancement errors break the page
    if (firstTab) {
      firstTab.setAttribute('tabindex', '0');
      firstTab.setAttribute('aria-selected', 'true');
    }
  }

  // Create a screened, visually-hidden live region to announce tab changes to AT
  try {
    const announcer = document.createElement('div');
    announcer.className = 'sr-only category-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    container.appendChild(announcer);
    container.__announcer = announcer;
    container.__lastAnnounced = '';
  } catch (e) {
    // ignore DOM errors
  }

  // Fade indicators: show gradient edges when tab list is scrollable and adapt colour to theme
  (function setupFadeIndicators() {
    const list = tabList;
    if (!list || typeof list.scrollWidth === 'undefined') return;

    const update = () => {
      const hasLeft = list.scrollLeft > 0;
      const hasRight = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
      container.classList.toggle('tabs--fade-left', hasLeft);
      container.classList.toggle('tabs--fade-right', hasRight);
    };

    // Update fade colour based on document theme attribute (data-theme)
    const updateFadeColor = () => {
      try {
        const theme = (document.documentElement && document.documentElement.getAttribute('data-theme')) || '';
        const fade = theme.toLowerCase() === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)';
        container.style.setProperty('--tabs-fade', fade);
      } catch (e) {
        // ignore
      }
    };

    // Observe theme changes to update fade colour dynamically
    let mo = null;
    try {
      const docEl = document.documentElement;
      if (typeof MutationObserver !== 'undefined') {
        mo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.attributeName === 'data-theme') updateFadeColor();
          }
        });
        mo.observe(docEl, { attributes: true, attributeFilter: ['data-theme'] });
      }
    } catch (e) {
      // ignore
    }

    // rAF-throttled schedule
    let rafId = null;
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        update();
        rafId = null;
      });
    };

    // Attach listeners
    list.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // initial checks
    updateFadeColor();
    schedule();
  })();
}


// Auto-run in browser contexts if module is imported directly
if (typeof document !== 'undefined') {
  try {
    initCategorySelect(document);
  } catch (e) {
    // silent fail to avoid noisy logs in environments without the select
  }
}
