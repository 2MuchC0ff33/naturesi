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

    // Check a selection of store category pages render Buy Now forms without JS
    const storePages = [
      '/pages/store/wellness-blends.html',
      '/pages/store/selfcare.html',
      '/pages/store/ice-tea.html',
      '/pages/store/herbal-infusions.html',
      '/pages/store/green-tea.html',
      '/pages/store/creams.html',
      '/pages/store/black-tea.html',
      '/pages/store/balms.html',
    ];

    for (const p of storePages) {
      await page.goto(p);
      await expect(page.locator('form.paypal-buynow').first()).toBeVisible();
    }

    // Confirm at least one product with packaging variants shows multiple Buy Now forms (artisan-blends)
    await page.goto('/pages/store/artisan-blends.html');
    const product = await page.locator('article.product').first();
    await expect(product.locator('form.paypal-buynow')).toHaveCount(2);

    // Cart page should render and show helpful message (no aggregate checkout)
    await page.goto('/pages/cart.html');
    await expect(page.locator('#btn-proceed-checkout')).toBeVisible();

    // Checkout page should indicate deprecation and give guidance
    await page.goto('/pages/checkout.html');
    await expect(page.locator('#payment')).toContainText('Aggregate checkout');

    await context.close();
  });
});
