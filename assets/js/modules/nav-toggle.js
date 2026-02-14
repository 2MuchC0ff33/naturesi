// nav-toggle.js -- Accessible mobile nav toggle (vanilla JS)
// Inserts an accessible hamburger button if one is not present and
// toggles the `.site-nav--open` class on the `.site-nav` element.

import { mqMax } from './breakpoints.js';
import { addKeyListener, delegate } from './event-delegation.js';

export function init(document) {
  // Prefer stable data-attribute hooks when present, fall back to legacy selectors
  const navRight = document.querySelector('[data-header-right]') || document.querySelector('.site-nav .nav-right');
  if (!navRight) return;

  // Locate primary nav containers using data attributes first
  const siteNav = document.querySelector('[data-site-nav]') || document.querySelector('.site-nav');
  const navCenter = document.querySelector('[data-primary-nav]');

  // Accept existing toggle by data attribute first, then id or other legacy JS hook selectors
  let btn = document.querySelector('[data-nav-toggle]') || document.querySelector('[data-js-nav-toggle], .js-nav-toggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'nav-toggle';
    btn.className = 'nav-toggle';
    // mark as a JS hook so future refactors can detect and preserve it
    btn.setAttribute('data-js-nav-toggle', '');
    // provide a stable, semantic hook for future selector modernisation
    btn.setAttribute('data-nav-toggle', '');
    btn.setAttribute('aria-label', 'Toggle navigation');
    btn.setAttribute('aria-expanded', 'false');
    // Point aria-controls to existing nav container id when available
    try {
      const controlId = (navCenter && navCenter.id) ? navCenter.id : '';
      btn.setAttribute('aria-controls', controlId);
    } catch (e) {
      btn.setAttribute('aria-controls', '');
    }
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
      </svg>
    `;
    // Hide button initially to prevent layout shift during insertion
    btn.style.display = 'none';
    navRight.insertBefore(btn, navRight.firstElementChild);
    // Show button after insertion using requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      btn.style.removeProperty('display'); // Revert to CSS-defined value
    });
  }
  // If the hook exists but isn't a button, ensure it's keyboard-operable
  if (btn.tagName !== 'BUTTON') {
    btn.setAttribute('role', 'button');
    if (!btn.hasAttribute('tabindex')) btn.setAttribute('tabindex', '0');
    if (!btn.hasAttribute('data-js-nav-toggle')) btn.setAttribute('data-js-nav-toggle', '');
  }
  // siteNav and navCenter were resolved earlier via data-attribute-aware selectors
  // Use centralized breakpoint tokens (reads CSS custom properties)
  const mq = mqMax('md');
  // Remember where focus was before opening so it can be restored
  let lastFocused = null;

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
    // Return focus to previous element when possible, otherwise to the toggle
    try {
      if (lastFocused && document.contains(lastFocused) && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      } else {
        btn.focus();
      }
    } catch (err) {
      btn.focus();
    }
  }

  function openNav() {
    btn.setAttribute('aria-expanded', 'true');
    siteNav.classList.add('site-nav--open');
    btn.classList.add('is-active');
    // Remember the element that had focus so it can be restored on close
    lastFocused = document.activeElement;
    // Apply scroll lock to prevent background scroll while overlay is open
    document.body.classList.add('nav-open');
    // On small screens expose the nav to assistive tech and focus inside
    if (mq.matches) {
      setAriaHidden(false);
      // Move focus into the nav so keyboard users can continue
      requestAnimationFrame(focusFirstInNav);
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

  // Close nav on Escape (use shared key helper)
  const _removeNavKey = addKeyListener(document, {
    Escape: () => closeNav(),
  });

  // Close nav when clicking outside (only when open)
  delegate(document, 'click', 'body', (e /* , _matched */) => {
    if (siteNav.classList.contains('site-nav--open') && !siteNav.contains(e.target)) closeNav();
  });

  // Ensure we clean up key handler if needed when script is unloaded (best-effort)
  // Attach to btn so other code can remove via btn.__removeNavKey
  btn.__removeNavKey = _removeNavKey;
}
