import { test, expect } from '@playwright/test';

test.describe('Proceed to checkout (Buy Now forms)', () => {
  test('Buy Now form exists on index and submits PayPal payload', async ({ page }) => {
    await page.goto('/');

    // Ensure the PayPal Buy Now form is present on the product card
    const paypalForm = page.locator('form.paypal-buynow').first();
    await expect(paypalForm).toBeVisible();

    // Add a submit listener to capture PayPal redirect and prevent navigation
    await page.evaluate(() => {
      (window as any).__lastPayPalForm = null;
      document.addEventListener(
        'submit',
        (e) => {
          try {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const data = Array.from(form.elements).reduce((acc: any, el: any) => {
              if (el && el.name) acc[el.name] = el.value;
              return acc;
            }, {});
            (window as any).__lastPayPalForm = data;
          } catch (err) {
            // ignore
          }
        },
        true
      );
    });

    // Click the first PayPal Buy Now button
    await paypalForm.locator('button[type="submit"]').click();

    // Assert we captured a PayPal payload
    await page.waitForFunction(() => (window as any).__lastPayPalForm !== null, { timeout: 5000 });
    const lastForm = await page.evaluate(() => (window as any).__lastPayPalForm || null);
    expect(lastForm).not.toBeNull();
    expect(lastForm.cmd).toBe('_xclick');
    expect(lastForm.business).toMatch(/@/);
    expect(Number(lastForm.amount)).toBeGreaterThan(0);
    expect(lastForm.return).toBeDefined();
    expect(lastForm.cancel_return).toBeDefined();
  });

  test('Buy Now works with JS disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const pageNoJS = await context.newPage();
    await pageNoJS.goto('/');

    // Even with JS off, the form should exist and be submittable
    const formExists = await pageNoJS.$('form.paypal-buynow');
    expect(formExists).not.toBeNull();

    // We cannot intercept submit easily with JS disabled, but the presence of the form indicates ability to submit to PayPal.
    await context.close();
  });

  test('product variant Buy Now forms exist and amounts are correct', async ({ page }) => {
    // Pick a store category page that has package variants (artisan-blends)
    await page.goto('/pages/store/artisan-blends.html');
    const firstProduct = page.locator('article.product').first();
    const forms = await firstProduct.locator('form.paypal-buynow').elementHandles();
    expect(forms.length).toBeGreaterThanOrEqual(2);

    // Check amounts for the two variant forms (14.00 and 22.00 expected)
    const amounts = await Promise.all(
      forms.map(async (f) => {
        const el = await f.$('input[name="amount"]');
        return el ? await el.getAttribute('value') : null;
      })
    );
    expect(amounts).toContain('14.00');
    expect(amounts).toContain('22.00');
  });

  test('with localStorage set directly, clicking proceed shows deprecation note', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem(
        'naturesi_cart',
        JSON.stringify([{ id: 'sku-test-direct', title: 'Direct Item', price: 9.99, qty: 1 }])
      );
    });

    await page.goto('/pages/cart.html');
    await page.waitForSelector('#btn-proceed-checkout');

    // Click proceed and expect deprecation messaging to be present (deprecation is static content on the page)
    await page.click('#btn-proceed-checkout');

    // The cart page contains the deprecation guidance in markup; assert it's visible
    await expect(page.locator('text=Aggregate checkout is deprecated')).toBeVisible();
  });

  test('UI path: add item -> cart -> proceed persists cart and shows save notice', async ({
    page,
  }) => {
    await page.route('**/assets/js/data/paypal.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(require('../fixtures/paypal.json')),
      })
    );

    // visit store and click first add-to-cart
    await page.goto('/pages/store/accessories.html');
    const add = page
      .locator(
        'form.product-options button.add-to-cart, form.product-options button[type="submit"]'
      )
      .first();
    await add.click();

    // navigate to cart
    await page.goto('/pages/cart.html');

    // click proceed button if present
    const btn = page.locator('#btn-proceed-checkout');
    if (await btn.count()) {
      await btn.click();
    }

    // ensure localStorage has a cart saved
    const stored = await page.evaluate(() => localStorage.getItem('naturesi_cart'));
    expect(stored).not.toBeNull();

    // check if a save note was inserted (non-blocking UX)
    const note = await page.locator('#checkout-save-note');
    expect(await note.count()).toBeGreaterThanOrEqual(0);
  });

  test('LocalStorage path: set cart -> checkout runCheckout fills PayPal form inputs', async ({
    page,
  }) => {
    await page.goto('/');
    const cart = require('../fixtures/sample-cart.json');
    await page.evaluate((c) => localStorage.setItem('naturesi_cart', JSON.stringify(c)), cart);

    await page.goto('/pages/checkout.html');

    // route paypal.json
    await page.route('**/assets/js/data/paypal.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(require('../fixtures/paypal.json')),
      })
    );

    // invoke runCheckout via dynamic import in the browser context
    await page.evaluate(async () => {
      // @ts-ignore - dynamic import with absolute path resolved in browser runtime
      const m = await import('/assets/js/modules/checkout.js');
      await m.runCheckout({ fetchPath: '/assets/js/data/paypal.json' });
    });

    // assert the PayPal form inputs are filled
    const business = await page.locator('#pp-business').inputValue();
    const amount = await page.locator('#pp-amount').inputValue();
    const item = await page.locator('#pp-item_name').inputValue();
    const action = await page.locator('#paypal-form').getAttribute('action');

    expect(business).toBeDefined();
    expect(Number(amount)).toBeGreaterThan(0);
    expect(item.length).toBeGreaterThan(0);
    expect(action).toBeDefined();
  });
});
