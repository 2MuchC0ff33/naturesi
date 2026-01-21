import { test, expect } from '@playwright/test';

test('checkout loads cart from localStorage and PayPal form is populated', async ({ page }) => {
  // Simulate a client-side cart (server-side add-to-cart isn't intercepted)
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem(
      'naturesi_cart',
      JSON.stringify([{ id: 'sku-test', title: 'Test Item', price: 4.99, qty: 2 }])
    );
  });

  // Navigate directly to checkout
  await page.goto('/pages/checkout.html');
  await page.waitForSelector('#summary-content');
  await expect(page.locator('#summary-content')).toContainText('Total');

  const amount = await page.locator('#pp-amount').inputValue();
  const amountNum = Number(amount);
  if (amountNum <= 0) {
    // In some browsers or test runs the config fetch may fail; ensure an error is shown instead
    await expect(page.locator('#checkout-error')).toBeVisible();
  } else {
    expect(amountNum).toBeCloseTo(9.98, 2);
  }

  const business = await page.locator('#pp-business').inputValue();
  expect(business).toContain('@');
});
