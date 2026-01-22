import { test, expect } from '@playwright/test';
import fs from 'fs';

test('checkout form amount is computed from cart for multi-item checkout', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([
        { id: 'sku-test', title: 'Test Item A', price: 4.99, qty: 1 },
        { id: 'sku-test-2', title: 'Test Item B', price: 2.01, qty: 1 },
      ])
    );
  });

  // Ensure PayPal config allows aggregate checkout for this test
  const PAYPAL = JSON.parse(fs.readFileSync('./tests/fixtures/paypal.json', 'utf-8'));
  await page.route('**/assets/js/data/paypal.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(Object.assign(PAYPAL, { allow_aggregate: true })),
    })
  );

  await page.goto('/pages/checkout.html');

  // Populate the checkout via runCheckout
  await page.evaluate(async () => {
    const p = '/assets/js/modules/' + 'checkout.js';
    const m = await import(p as any);
    await m.runCheckout({ fetchPath: '/assets/js/data/paypal.json' });
  });

  // Aggregated PayPal inputs should be present and amount equals 6.99
  await expect(page.locator('#pp-amount')).toHaveCount(1);
  const amt = await page.locator('#pp-amount').inputValue();
  // Expect 4.99 + 2.01 = 7.00
  expect(Number(amt)).toBeCloseTo(7.0, 2);
});
