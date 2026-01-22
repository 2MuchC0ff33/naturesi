import { test, expect } from '@playwright/test';

test.describe('Payment return handling', () => {
  test('clears localStorage and header cart after PayPal return params', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!window.NaturesCart, { timeout: 5000 });

    // Seed storage with a cart
    await page.evaluate(() => {
      window.localStorage.setItem(
        'naturesi_cart',
        JSON.stringify([{ id: 'sku-test-pp', title: 'PP item', price: 1.0, qty: 2 }])
      );
      window.localStorage.setItem('naturesi-cart', 'placeholder');
    });

    // Navigate to success page with PayPal return params
    await page.goto('/pages/payment/success.html?PayerID=ABC123&tx=TX123');

    // Wait for either the note or storage to be cleared
    await page.waitForFunction(
      () =>
        document.getElementById('cart-cleared-note') !== null ||
        !window.localStorage.getItem('naturesi_cart'),
      { timeout: 3000 }
    );

    const cartAfter = await page.evaluate(() => window.localStorage.getItem('naturesi_cart'));
    expect(cartAfter).toBeNull();
    const cartAlt = await page.evaluate(() => window.localStorage.getItem('naturesi-cart'));
    expect(cartAlt).toBeNull();

    // Go to store page and verify header cart count is 0
    await page.goto('/pages/store.html');
    await page.waitForFunction(() => !!window.NaturesCart, { timeout: 5000 });
    const headerCount = await page.locator('output[name="cart-count"]').first().textContent();
    expect(headerCount).toBe('0');
  });
});
