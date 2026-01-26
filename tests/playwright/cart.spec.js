// Playwright smoke test: add-to-cart -> cart -> checkout (simple flow)
// Requirements: install Playwright locally (`npm i -D playwright @playwright/test`) and run `npx playwright test`

const { test, expect } = require('@playwright/test');

test.describe('Cart smoke', () => {
  test('add to cart and check localStorage', async ({ page }) => {
    await page.goto('http://localhost:8000/pages/store/artisan-blends.html');

    // Wait for the add-to-cart form to be available
    await page.waitForSelector('form.add-to-cart');

    // Click the first Add to Cart button (submit)
    await page.click('form.add-to-cart button.add-to-cart');

    // Allow app.js to update localStorage and UI
    await page.waitForTimeout(400);

    // Check localStorage contains cart key
    const cartKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(cartKeys.some(k => k.includes('naturesi_cart') || k.includes('naturesi-cart'))).toBeTruthy();

    // Open cart page and confirm product is listed
    await page.goto('http://localhost:8000/pages/cart.html');
    await page.waitForSelector('#cart-items, .cart-items, .cart-list, .cart');
    const hasItems = await page.evaluate(() => {
      const el = document.querySelector('#cart-items, .cart-items, .cart-list, .cart');
      if (!el) return false;
      return el.querySelectorAll('li, .cart-item, [data-sku]').length > 0;
    });
    expect(hasItems).toBeTruthy();
  });
});
