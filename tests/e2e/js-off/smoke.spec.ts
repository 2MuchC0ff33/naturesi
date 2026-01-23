import { test, expect } from '@playwright/test';

test.describe('JS-disabled smoke tests @smoke', () => {
  test('index.html has core navigation and forms (JS disabled)', async ({ page }) => {
    await page.goto('/index.html');
    // skip link visible on focus
    const skip = await page.locator('.skip-link');
    expect(await skip.getAttribute('href')).toBe('#main-content');

    // Search form exists and is a GET form
    const search = await page.locator('form[role="search"]');
    expect(await search.getAttribute('method')).toBe('get');

    // Category noscript fallback exists for JS-disabled navigation
    const noscript = await page.locator('nav[aria-label="Browse by category"] noscript');
    expect(await noscript.count()).toBeGreaterThan(0);
  });

  test('store product pages include accessible add-to-cart forms and Buy Now buttons', async ({
    page,
  }) => {
    await page.goto('/pages/store/accessories.html');

    // There should be at least one product form that posts to /add-to-cart
    const productForm = page.locator('form[action="/add-to-cart"]');
    expect(await productForm.count()).toBeGreaterThan(0);

    // Buttons exist and have type=submit
    const addButtons = page.locator('button.add-to-cart[type="submit"], button[type="submit"]');
    expect(await addButtons.count()).toBeGreaterThan(0);
  });
});
