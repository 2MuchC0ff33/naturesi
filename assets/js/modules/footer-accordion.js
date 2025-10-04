// Module: Footer accordion behaviour
// Purpose: encapsulate accessible accordion logic for the footer quick-links so it is testable and maintainable
export function wireFooterAccordionHandlers() {
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
}

export function initFooterAccordions() {
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
