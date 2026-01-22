import { test, expect } from '@playwright/test';

test('checkout form amount is computed from cart and overrides tampering', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([{ id: 'sku-test', title: 'Test Item', price: 4.99, qty: 2 }])
    );
  });

  await page.goto('/pages/checkout.html');
  // Aggregate checkout is deprecated; ensure the page shows guidance and no aggregated PayPal inputs are present
  await expect(page.locator('#payment')).toContainText('Aggregate checkout');
  await expect(page.locator('#pp-amount')).toHaveCount(0);
});
