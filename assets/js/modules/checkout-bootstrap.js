// Minimal checkout bootstrap moved out of HTML to satisfy inline-script policy
(async () => {
  const summary = typeof document !== 'undefined' ? document.getElementById('summary-content') : null;
  if (!summary) return;
  try {
    const mod = await import('/assets/js/modules/checkout.js');
    if (mod && typeof mod.runCheckout === 'function') {
      await mod.runCheckout();
    } else {
      const note = document.getElementById('checkout-note');
      if (note) note.textContent = 'Checkout initialisation is unavailable. If you see this unexpectedly, try refreshing the page.';
      console.warn('checkout.runCheckout not available');
    }
  } catch (err) {
    console.error('Checkout initialization failed:', err);
    const errEl = document.getElementById('checkout-error');
    if (errEl) {
      errEl.classList.remove('hidden');
      errEl.textContent = 'Unable to load checkout details. Please try again later.';
    }
  }
})();
