import { test, expect } from '@playwright/test';

test('Aggregate PayPal checkout redirects with correct payload', async ({ page }) => {
  await page.goto('/');

  // Put multi-item cart into localStorage
  await page.evaluate(() => {
    window.localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([
        { id: 'sku-a', title: 'A', price: 3.0, qty: 1 },
        { id: 'sku-b', title: 'B', price: 2.0, qty: 1 },
      ])
    );
  });

  // Ensure PayPal config allows aggregate checkout
  await page.route('**/assets/js/data/paypal.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(Object.assign(require('./fixtures/paypal.json'), { allow_aggregate: true })),
    })
  );

  await page.goto('/pages/checkout.html');

  // invoke runCheckout to create/populate the aggregated form
  await page.evaluate(async () => {
    const p = '/assets/js/modules/' + 'checkout.js';
    // dynamic import resolved in browser runtime during E2E
    const m = await import(p as any);
    await m.runCheckout({ fetchPath: '/assets/js/data/paypal.json' });
  });

  // Attach submit listener to capture payload
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

  // Click the Pay with PayPal button
  await page.locator('#pay-now').click();

  await page.waitForFunction(() => (window as any).__lastPayPalForm !== null, { timeout: 5000 });
  const lastForm = await page.evaluate(() => (window as any).__lastPayPalForm || null);

  expect(lastForm).not.toBeNull();
  expect(lastForm.cmd).toBe('_xclick');
  expect(Number(lastForm.amount)).toBeCloseTo(5.0, 2);
  expect(lastForm.business).toMatch(/@/);
});
