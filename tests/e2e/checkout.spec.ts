import { test, expect } from '@playwright/test';

test('checkout shows deprecation note and instructs using Buy Now buttons', async ({ page }) => {
  // Simulate a client-side cart (for progressive enhancement)
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([{ id: 'sku-test', title: 'Test Item', price: 4.99, qty: 2 }])
    );
  });

  // Navigate directly to checkout
  await page.goto('/pages/checkout.html');
  await expect(page.locator('#payment')).toContainText(
    'Aggregate checkout (paying for multiple items in a single request) is deprecated'
  );

  // Ensure Buy Now buttons exist on the store index as the recommended flow
  await page.goto('/');
  const buyNow = page.locator('form.paypal-buynow button[type="submit"]').first();
  await expect(buyNow).toBeVisible();

  // The presence of Buy Now forms means users can complete purchase without JS
  // Also verify that localStorage is still populated (progressive enhancement case)
  const cartStr = await page.evaluate(() => window.localStorage.getItem('naturesi_cart'));
  const cart = JSON.parse(cartStr || 'null');
  expect(Array.isArray(cart)).toBe(true);
});
