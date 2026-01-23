import PAYPAL_CONFIG from './paypal-config.js';
import { loadPayPalConfig } from './checkout.js';

async function initPayPalForms(overrideCfg) {
  try {
    // Prefer runtime config from the data file (which your deploy can update from .env)
    const cfg =
      overrideCfg ||
      (await loadPayPalConfig('/assets/js/data/paypal.json', 1)) ||
      PAYPAL_CONFIG ||
      {};
    const business = cfg && cfg.business && cfg.business.trim();
    const env = (cfg.env || 'sandbox').toLowerCase();
    const liveAction = 'https://www.paypal.com/cgi-bin/webscr';
    const sandboxAction = 'https://www.sandbox.paypal.com/cgi-bin/webscr';

    // Update or create PayPal forms for each product variant
    document.querySelectorAll('article.product').forEach((product) => {
      // Determine product name
      let title = (
        product.querySelector('[itemprop="name"]') || product.querySelector('h2,h3,h4')
      )?.textContent?.trim();
      if (!title) title = product.getAttribute('data-sku') || 'Item';

      // Find package options (radios or labelled prices)
      const packageInputs = Array.from(
        product.querySelectorAll('.package-options input[type="radio"]')
      );
      // If no radios, try to infer price from existing PayPal form
      const packages = packageInputs.length
        ? packageInputs.map((i) => ({
            name: i.value,
            price: i.dataset?.price || i.getAttribute('content') || i.value,
          }))
        : [];

      // If there are no package radios, ensure existing forms are updated
      if (!packages.length) {
        product.querySelectorAll('form.paypal-buynow').forEach((form) => {
          // set sandbox/live action
          form.action = env === 'live' ? liveAction : sandboxAction;
          if (business) {
            const input = form.querySelector('input[name="business"]');
            if (input) input.value = business;
            else {
              const hidden = document.createElement('input');
              hidden.type = 'hidden';
              hidden.name = 'business';
              hidden.value = business;
              form.insertBefore(hidden, form.firstChild);
            }
          }
        });
        return;
      }

      // Create missing variant forms based on package options
      packages.forEach((pkg) => {
        const pkgName = pkg.name || 'variant';
        const pkgPrice = String(pkg.price || '0').replace(/[^\d.-]+/g, '') || '0';
        // Look for existing form with data-package= pkgName
        let form = product.querySelector(`form.paypal-buynow[data-package="${pkgName}"]`);
        if (!form) {
          form = document.createElement('form');
          form.className = 'paypal-buynow';
          form.setAttribute('method', 'post');
          form.setAttribute('target', '_top');
          form.setAttribute('aria-label', `Buy ${title} (${pkgName}) on PayPal`);
          form.dataset.package = pkgName;
          form.innerHTML = `
            <input type="hidden" name="cmd" value="_xclick" />
            <input type="hidden" name="business" value="" />
            <input type="hidden" name="item_name" value="${title} (${pkgName})" />
            <input type="hidden" name="amount" value="${pkgPrice}" />
            <input type="hidden" name="currency_code" value="${cfg.currency || 'AUD'}" />
            <input type="hidden" name="return" value="${cfg.return_path || cfg.return || '/pages/payment/success.html'}" />
            <input type="hidden" name="cancel_return" value="${cfg.cancel_path || cfg.cancel || '/pages/payment/fail.html'}" />
            <button type="submit" class="btn btn-paypal">Buy Now (${pkgName})</button>
          `;
          // append after product's product-options or at end
          const opts = product.querySelector('form.product-options') || product;
          opts.parentNode.insertBefore(form, opts.nextSibling);
        }
        // Always update action and business
        form.action = env === 'live' ? liveAction : sandboxAction;
        if (business) {
          const input = form.querySelector('input[name="business"]');
          if (input) input.value = business;
        }
      });
    });

    // Also update any remaining unmatched forms on page
    document.querySelectorAll('form.paypal-buynow').forEach((form) => {
      form.action = env === 'live' ? liveAction : sandboxAction;
      if (business) {
        const input = form.querySelector('input[name="business"]');
        if (input) input.value = business;
      }
    });
  } catch (err) {
    // Non-fatal
    console.error('paypal-init: failed to initialize PayPal forms', err);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void initPayPalForms());
  } else {
    void initPayPalForms();
  }
}

export { initPayPalForms };
