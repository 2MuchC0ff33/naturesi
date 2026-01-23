import { test, expect } from '@playwright/test';

test.describe('Proceed-to-Checkout Flow', () => {
  test('should navigate to checkout page and display PayPal button', async ({ page }) => {
    // Navigate to the cart page
    await page.goto('http://127.0.0.1:8080/pages/cart.html');

    // Verify cart page loaded
    await expect(page).toHaveTitle(/Cart/);

    // Click the proceed-to-checkout button
    await page.click('#proceed-to-checkout');

    // Verify navigation to checkout page
    await expect(page).toHaveURL(/pages\/checkout.html/);

    // Verify PayPal button is visible
    const paypalButton = page.locator('#paypal-button');
    await expect(paypalButton).toBeVisible();
  });
});
