// Development app.js with no caching and live reload helpers

// Only register service worker in production or secure contexts
if (
  'serviceWorker' in navigator &&
  (window.location.hostname === 'localhost' || window.location.protocol === 'https:')
) {
  window.addEventListener('load', () => {
    // Clear all caches on page load for development
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key);
          console.log('Cleared cache:', key);
        });
      });
    }

    // Register the no-cache service worker
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        registration.update();
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Development mode helpers
if (window.location.hostname === 'localhost') {
  // Force reload on focus for development
  window.addEventListener('focus', () => {
    console.log('Window focused - Development mode active');
    location.reload();
  });

  // Add timestamp to help identify fresh loads
  console.log('Page loaded at:', new Date().toISOString());
}

// Simple accessible accordion behaviour for footer quick-links
document.addEventListener('DOMContentLoaded', () => {
  const toggles = document.querySelectorAll('.accordion-toggle[data-controls]');
  toggles.forEach((button) => {
    const panelId = button.getAttribute('data-controls');
    const panel = document.getElementById(panelId);
    if (!panel) return;

    // Ensure initial ARIA state
    if (!button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', 'false');
    if (!panel.hasAttribute('aria-hidden')) panel.setAttribute('aria-hidden', 'false');

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      // Toggle visibility; small screens will honour CSS display: none when aria-hidden is true
      panel.setAttribute('aria-hidden', expanded ? 'true' : 'false');
    });

    // Allow keyboard enter/space activation
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });
  });
});

// Collapse panels by default on very small viewports for ergonomics
function initFooterAccordions() {
  const small = window.matchMedia('(max-width: 480px)').matches;
  document.querySelectorAll('.accordion-toggle[data-controls]').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('data-controls'));
    if (!panel) return;
    if (small) {
      btn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
    } else {
      // allow visible by default on larger screens
      btn.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
    }
  });
}

// Initialise on load and when viewport size changes
window.addEventListener('load', initFooterAccordions);
window.addEventListener('resize', () => {
  // debounce-ish behaviour: run after resize completes
  clearTimeout(window.__footerAccordionResizeTimer);
  window.__footerAccordionResizeTimer = setTimeout(initFooterAccordions, 120);
});

/* Wire category selection into the search form so OpenSearch and regular form submits include category.
   Small, reversible behaviour enhancement; doesn't touch payments or service-worker logic. */
document.addEventListener('DOMContentLoaded', function () {
  var categoryList = document.querySelector('.category-dropdown ul[role="listbox"]');
  var hiddenCategory = document.getElementById('search-category');

  if (!categoryList || !hiddenCategory) return;

  // Click / tap handler: set hidden input and mark aria-selected for accessibility
  categoryList.addEventListener('click', function (ev) {
    var li = ev.target.closest('li[role="option"]');
    if (!li) return;
    var value = li.dataset && li.dataset.value ? li.dataset.value : '';
    hiddenCategory.value = value;

    Array.prototype.forEach.call(
      categoryList.querySelectorAll('li[role="option"]'),
      function (opt) {
        opt.setAttribute('aria-selected', opt === li ? 'true' : 'false');
      }
    );
  });

  // Keyboard support: Enter and Space activate options
  categoryList.addEventListener('keydown', function (ev) {
    var li = ev.target.closest('li[role="option"]');
    if (!li) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      li.click();
    }
  });
});
