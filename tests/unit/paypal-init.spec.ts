import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { initPayPalForms } from '../../assets/js/modules/paypal-init.js';

// Simple smoke test for PayPal init: it should create/update forms for product variants
describe('paypal-init', () => {
  it('creates variant forms and sets business from config', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <article class="product" data-sku="sku-1">
        <form class="product-options">
          <div class="package-options">
            <label><input type="radio" name="package" value="pouch" checked data-price="14.00"/></label>
            <label><input type="radio" name="package" value="cylinder" data-price="22.00"/></label>
          </div>
        </form>
      </article>
    </body></html>`, { runScripts: 'dangerously' });
    const doc = dom.window.document;

    // Make jsdom's document available to the module under test
    // @ts-ignore
    global.document = doc; // eslint-disable-line no-global-assign
    // @ts-ignore
    global.window = dom.window;

    // stub loadPayPalConfig by creating a minimal global fetchable file - since initPayPalForms uses loadPayPalConfig which uses fetch, we patch globalThis.fetch
    const fakeCfg = { env: 'sandbox', business: 'sandbox-test@example.com', sandbox_url: 'https://sandbox.paypal', currency: 'AUD' };
    // stub global fetch which loadPayPalConfig uses
    // @ts-ignore
    global.fetch = async () => ({ ok: true, json: async () => fakeCfg });

    // run init in this global context
    await initPayPalForms();

    // product should now have two paypal forms
    const forms = doc.querySelectorAll('article.product form.paypal-buynow');
    expect(forms.length).toBeGreaterThanOrEqual(2);

    // Check that each form has the business input set
    forms.forEach((f) => {
      const input = f.querySelector('input[name="business"]');
      expect(input).not.toBeNull();
      expect((input as HTMLInputElement).value).toBe('sandbox-test@example.com');
    });

    // Check one form amount values
    const amounts = Array.from(forms).map((f) => (f.querySelector('input[name="amount"]') as HTMLInputElement)?.value);
    expect(amounts).toContain('14.00');
    expect(amounts).toContain('22.00');
  });
});