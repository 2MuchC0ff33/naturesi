import { test, expect } from '@playwright/test';

test('homepage visual snapshot @visual', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page).toHaveScreenshot({ fullPage: true });
});

test('checkout visual snapshot @visual', async ({ page }) => {
  // provide a small sample cart so checkout is populated
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([{ id: 'sku-test', title: 'Test Item', price: 4.99, qty: 2 }])
    );
  });
  await page.goto('/pages/checkout.html');
  await expect(page).toHaveScreenshot({ fullPage: true });
});
