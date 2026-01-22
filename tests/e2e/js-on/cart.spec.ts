import { test, expect } from '@playwright/test';

test.describe('JS-enabled cart interactions', () => {
  test('adding a product updates the cart count and cart page shows items @smoke', async ({
    page,
  }) => {
    // Skip this test for JS-disabled projects
    test.skip(test.info().project.name.includes('js-off'), 'Requires JS enabled');
    await page.goto('/pages/store/accessories.html');

    // Find first Add to Cart button and click it
    const add = page
      .locator(
        'form.product-options button.add-to-cart, form.product-options button[type="submit"]'
      )
      .first();
    await add.click();

    // Expect cart count to increase (cart-count output element updated)
    const cartCount = page.locator('.cart-count');
    await expect(cartCount).toHaveText(/\d+/);

    // Visit cart page and ensure items are present (JS-enabled flow should show items)
    await page.goto('/pages/cart.html');
    const tbody = page.locator('table.cart-table tbody');
    expect(await tbody.locator('tr').count()).toBeGreaterThan(0);
  });
});
