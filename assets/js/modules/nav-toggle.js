// nav-toggle.js -- Accessible mobile nav toggle (vanilla JS)
// Inserts an accessible hamburger button if one is not present and
// toggles the `.site-nav--open` class on the `.site-nav` element.

export function init(document) {
  const navRight = document.querySelector('.site-nav .nav-right');
  if (!navRight) return;

  let btn = document.getElementById('nav-toggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'nav-toggle';
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Toggle navigation');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'primary-nav-menu');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
      </svg>
    `;
    navRight.insertBefore(btn, navRight.firstElementChild);
  }

  const siteNav = document.querySelector('.site-nav');
  const navCenter = document.getElementById('primary-nav-menu');
  const mq = window.matchMedia('(max-width: 900px)');

  function setAriaHidden(hidden) {
    if (!navCenter) return;
    if (hidden) navCenter.setAttribute('aria-hidden', 'true');
    else navCenter.removeAttribute('aria-hidden');
  }

  function focusFirstInNav() {
    if (!navCenter) return;
    const first = navCenter.querySelector('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (first) first.focus({ preventScroll: true });
  }

  function closeNav() {
    btn.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('site-nav--open');
    btn.classList.remove('is-active');
    // On small screens hide the nav from assistive tech
    if (mq.matches) setAriaHidden(true);
    // Remove scroll lock
    document.body.classList.remove('nav-open');
    // Return focus to the toggle
    btn.focus();
  }

  function openNav() {
    btn.setAttribute('aria-expanded', 'true');
    siteNav.classList.add('site-nav--open');
    btn.classList.add('is-active');
    // Apply scroll lock to prevent background scroll while overlay is open
    document.body.classList.add('nav-open');
    // On small screens expose the nav to assistive tech and focus inside
    if (mq.matches) {
      setAriaHidden(false);
      // Move focus into the nav so keyboard users can continue
      setTimeout(focusFirstInNav, 50);
    }
  }

  function toggle() {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    if (expanded) closeNav();
    else openNav();
  }

  // Ensure correct initial aria-hidden state based on viewport
  function updateAriaState() {
    if (!navCenter) return;
    if (mq.matches && !siteNav.classList.contains('site-nav--open')) {
      setAriaHidden(true);
    } else {
      setAriaHidden(false);
    }
  }

  updateAriaState();
  mq.addEventListener('change', updateAriaState);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  // Close nav on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNav();
    }
  });

  // Close nav when clicking outside (only when open)
  document.addEventListener('click', (e) => {
    if (siteNav.classList.contains('site-nav--open') && !siteNav.contains(e.target)) closeNav();
  });
}
