// modal.js — Minimal accessible modal controller (vanilla JS)
// Usage:
// <button data-modal-target="#newsletter-modal">Open</button>
// <div id="newsletter-modal" class="modal" aria-hidden="true">
//   <div class="modal__overlay" data-modal-close></div>
//   <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">...</div>
// </div>

import { delegate, addKeyListener } from './event-delegation.js';

export function init(document) {
  if (typeof document === 'undefined') return;

  const BODY_CLASS = 'modal-open';

  function getFocusable(container) {
    if (!container) return [];
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(FOCUSABLE));
  }

  function trapFocus(modalEl, e) {
    const focusable = getFocusable(modalEl);
    if (!focusable.length) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openModal(modalEl, trigger) {
    if (!modalEl) return;

    // Prefer native <dialog> when available for improved built-in behaviour
    const isNativeDialog = modalEl.tagName && modalEl.tagName.toLowerCase() === 'dialog' && typeof modalEl.showModal === 'function';

    try {
      if (isNativeDialog) {
        // Ensure aria-hidden removed from the dialog container
        modalEl.removeAttribute('aria-hidden');
        modalEl.showModal();
        modalEl.classList.add('is-open');
      } else {
        modalEl.setAttribute('open', '');
        modalEl.classList.add('is-open');
      }
    } catch (e) {
      // Fallback to class-based open state if showModal throws
      modalEl.setAttribute('open', '');
      modalEl.classList.add('is-open');
    }

    document.body.classList.add(BODY_CLASS);

    // Hide main content from AT
    const main = document.querySelector('main') || document.body;
    if (main) main.setAttribute('aria-hidden', 'true');

    // focus dialog content element (the visual dialog surface)
    const dialog = modalEl.querySelector('.modal__dialog') || modalEl;
    // store the element that had focus so we can restore it later
    modalEl.__previousActive = document.activeElement;

    try {
      dialog.setAttribute('tabindex', '-1');
      // Ensure dialog has correct semantics for assistive tech
      if (!dialog.hasAttribute('role')) dialog.setAttribute('role', 'dialog');
      if (!dialog.hasAttribute('aria-modal')) dialog.setAttribute('aria-modal', 'true');
    } catch (err) {
      // ignore if setting attributes fails for any reason
    }

    // Use requestAnimationFrame to avoid arbitrary time delays and improve reliability
    requestAnimationFrame(() => {
      const focusable = getFocusable(modalEl);
      if (focusable.length) focusable[0].focus({ preventScroll: true });
      else dialog.focus({ preventScroll: true });
    });

    // store trigger for returning focus
    modalEl.__trigger = trigger;

    // Use shared key helper and store remover so it can be cleaned up on close
    modalEl.__removeKey = addKeyListener(document, {
      Escape: () => closeModal(modalEl),
      Tab: (e) => trapFocus(modalEl, e),
    });
  }

  function closeModal(modalEl) {
    if (!modalEl) return;

    const isNativeDialog = modalEl.tagName && modalEl.tagName.toLowerCase() === 'dialog' && typeof modalEl.close === 'function';

    try {
      if (isNativeDialog) {
        // native dialog close handles removing open state
        modalEl.close();
        modalEl.classList.remove('is-open');
      } else {
        modalEl.removeAttribute('open');
        modalEl.classList.remove('is-open');
      }
    } catch (e) {
      // fallback
      modalEl.removeAttribute('open');
      modalEl.classList.remove('is-open');
    }

    document.body.classList.remove(BODY_CLASS);
    const main = document.querySelector('main') || document.body;
    if (main) main.removeAttribute('aria-hidden');

    // restore focus: prefer the trigger, otherwise the element that had focus before open
    try {
      const returnTo = modalEl.__trigger || modalEl.__previousActive;
      if (returnTo && typeof returnTo.focus === 'function' && document.contains(returnTo)) returnTo.focus();
    } catch (e) {
      // ignore
    }

    if (modalEl.__removeKey) modalEl.__removeKey();
  }

  // Open triggers
  const triggers = Array.from(document.querySelectorAll('[data-modal-target]'));
  triggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const selector = btn.getAttribute('data-modal-target');
      if (!selector) return;

      // Try a few robust resolution strategies:
      // 1) If selector is a valid CSS selector (e.g. '#newsletter-modal'), query it.
      // 2) If not found, and selector looks like an id (no leading #), try document.getElementById.
      // 3) Fallback to attempting `#id` query in case the author omitted the '#'.
      let modalEl = null;
      try {
        modalEl = document.querySelector(selector);
      } catch (err) {
        modalEl = null;
      }

      if (!modalEl) {
        const maybeId = selector.replace(/^#/, '').trim();
        if (maybeId) modalEl = document.getElementById(maybeId) || document.querySelector(`#${maybeId}`);
      }

      if (!modalEl) return;
      e.preventDefault();
      openModal(modalEl, btn);
    });
  });

  // Close triggers (overlay or [data-modal-close])
  delegate(document, 'click', '[data-modal-close]', (e, close) => {
    e.preventDefault();
    const modalEl = close.closest('.modal');
    if (!modalEl) return;
    closeModal(modalEl);
  });

  // Close when clicking outside dialog but inside modal container
  delegate(document, 'click', '.modal', (e, m) => {
    if (!m || m.classList.contains('is-open') === false) return;
    const dialog = m.querySelector('.modal__dialog');
    if (dialog && !dialog.contains(e.target) && !e.target.closest('[data-modal-target]')) {
      closeModal(m);
    }
  });

  // Expose API for programmatic control
  return {
    open: openModal,
    close: closeModal,
  };
}
