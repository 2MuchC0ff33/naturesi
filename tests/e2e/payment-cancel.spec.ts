import { test, expect } from '@playwright/test';

test.describe('Payment cancel handling', () => {
  test('keeps localStorage and header cart after PayPal cancel return', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!window.NaturesCart, { timeout: 5000 });

    // Seed storage with a cart (qty 2)
    await page.evaluate(() => {
      window.localStorage.setItem(
        'naturesi_cart',
        JSON.stringify([{ id: 'sku-cancel-test', title: 'Cancel item', price: 1.0, qty: 2 }])
      );
    });

    // Navigate to fail page with a token param to simulate a cancel return
    await page.goto('/pages/payment/fail.html?token=ABC123');

    // Wait for either the visible note or for storage to remain present
    await page.waitForFunction(
      () =>
        document.getElementById('cart-cancelled-note') !== null ||
        window.localStorage.getItem('naturesi_cart') !== null,
      { timeout: 3000 }
    );

    // Storage should still be present
    const cartAfter = await page.evaluate(() => window.localStorage.getItem('naturesi_cart'));
    expect(cartAfter).not.toBeNull();

    // Go to store and verify header cart count is '2'
    await page.goto('/pages/store.html');
    await page.waitForFunction(() => !!window.NaturesCart, { timeout: 5000 });
    const headerCount = await page.locator('output[name="cart-count"]').first().textContent();
    expect(headerCount).toBe('2');
  });
});
