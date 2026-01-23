import { test, expect } from '@playwright/test';

test.describe('No-JS smoke tests', () => {
  test('critical pages render without JS', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    // Home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Nature's Infusions/);

    // Store category
    await page.goto('/pages/store.html');
    await expect(page.locator('.nav-center')).toBeVisible();

    // Check a selection of store category pages render without JS
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
      await expect(page.locator('article.product').first()).toBeVisible();
    }

    // Confirm at least one product page renders (artisan-blends)
    await page.goto('/pages/store/artisan-blends.html');
    const product = await page.locator('article.product').first();
    await expect(product).toBeVisible();

    // Cart page should render and show helpful message (no aggregate checkout)
    await page.goto('/pages/cart.html');
    await expect(page.locator('#btn-proceed-checkout')).toBeVisible();

    // Checkout page should contain a noscript guidance message when JS is disabled
    await page.goto('/pages/checkout.html');
    // Ensure the noscript guidance is present when JS is disabled
    await expect(page.locator('#payment noscript')).toHaveCount(1);

    await context.close();
  });
});
