// modal.js — Minimal accessible modal controller (vanilla JS)
// Usage:
// <button data-modal-target="#newsletter-modal">Open</button>
// <div id="newsletter-modal" class="modal" aria-hidden="true">
//   <div class="modal__overlay" data-modal-close></div>
//   <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">...</div>
// </div>

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
    modalEl.setAttribute('open', '');
    modalEl.classList.add('is-open');
    document.body.classList.add(BODY_CLASS);
    // Hide main content from AT
    const main = document.querySelector('main') || document.body;
    if (main) main.setAttribute('aria-hidden', 'true');

    // focus dialog
    const dialog = modalEl.querySelector('.modal__dialog') || modalEl;
    dialog.setAttribute('tabindex', '-1');
    setTimeout(() => dialog.focus({ preventScroll: true }), 50);

    // store trigger for returning focus
    modalEl.__trigger = trigger;

    function onKey(e) {
      if (e.key === 'Escape') closeModal(modalEl);
      trapFocus(modalEl, e);
    }

    modalEl.__onKey = onKey;
    document.addEventListener('keydown', onKey);
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.removeAttribute('open');
    modalEl.classList.remove('is-open');
    document.body.classList.remove(BODY_CLASS);
    const main = document.querySelector('main') || document.body;
    if (main) main.removeAttribute('aria-hidden');

    // restore focus
    try {
      if (modalEl.__trigger && typeof modalEl.__trigger.focus === 'function') modalEl.__trigger.focus();
    } catch (e) {
      // ignore
    }

    if (modalEl.__onKey) document.removeEventListener('keydown', modalEl.__onKey);
  }

  // Open triggers
  const triggers = Array.from(document.querySelectorAll('[data-modal-target]'));
  triggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const selector = btn.getAttribute('data-modal-target');
      if (!selector) return;
      const modalEl = document.querySelector(selector);
      if (!modalEl) return;
      e.preventDefault();
      openModal(modalEl, btn);
    });
  });

  // Close triggers (overlay or [data-modal-close])
  document.addEventListener('click', (e) => {
    const close = e.target.closest('[data-modal-close]');
    if (!close) return;
    const modalEl = close.closest('.modal');
    if (!modalEl) return;
    e.preventDefault();
    closeModal(modalEl);
  });

  // Close when clicking outside dialog but inside modal container
  document.addEventListener('click', (e) => {
    const m = e.target.closest('.modal');
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
