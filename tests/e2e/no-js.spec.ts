import { test, expect } from '@playwright/test';

test.describe('No-JS smoke tests', () => {
  test('critical pages render and Buy Now forms are present without JS', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    // Home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Nature's Infusions/);
    // Buy Now form should exist on product cards
    const buyNow = await page.$('form.paypal-buynow');
    expect(buyNow).not.toBeNull();

    // Store category
    await page.goto('/pages/store.html');
    await expect(page.locator('.nav-center')).toBeVisible();

    // Cart page should render and show helpful message (no aggregate checkout)
    await page.goto('/pages/cart.html');
    await expect(page.locator('#btn-proceed-checkout')).toBeVisible();

    // Checkout page should indicate deprecation and give guidance
    await page.goto('/pages/checkout.html');
    await expect(page.locator('#payment')).toContainText('Aggregate checkout');

    await context.close();
  });
});
