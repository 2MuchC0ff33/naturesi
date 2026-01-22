import PAYPAL_CONFIG from './paypal-config.js';

function setBusinessOnForms() {
  try {
    const cfg = PAYPAL_CONFIG || {};
    const business = cfg.business && cfg.business.trim();
    const env = (cfg.env || 'sandbox').toLowerCase();
    const liveAction = 'https://www.paypal.com/cgi-bin/webscr';
    const sandboxAction = 'https://www.sandbox.paypal.com/cgi-bin/webscr';

    document.querySelectorAll('form.paypal-buynow').forEach((form) => {
      // set action according to env
      if (env === 'live') {
        form.action = liveAction;
      } else {
        form.action = sandboxAction;
      }

      // set business input if present and config provides it
      if (business) {
        const input = form.querySelector('input[name="business"]');
        if (input) {
          input.value = business;
        } else {
          // if input missing, create it
          const hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = 'business';
          hidden.value = business;
          form.insertBefore(hidden, form.firstChild);
        }
      }
    });
  } catch (err) {
    // Non-fatal; don't break page if this fails
    console.error('paypal-init: failed to initialize PayPal form config', err);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setBusinessOnForms);
  } else {
    setBusinessOnForms();
  }
}

export { setBusinessOnForms };
