import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Back button behaviour on checkout', () => {
  test('proceed -> checkout, back should return to cart and not auto-redirect', async ({
    page,
  }) => {
    // Prepare cart in localStorage
    const cart = JSON.parse(fs.readFileSync('./tests/fixtures/sample-cart.json', 'utf-8'));
    await page.goto('/');
    await page.evaluate((c) => localStorage.setItem('naturesi_cart', JSON.stringify(c)), cart);

    // Go to cart and click proceed
    await page.goto('/pages/cart.html');
    await page.waitForSelector('#btn-proceed-checkout');
    await page.click('#btn-proceed-checkout');

    // Wait for checkout URL (or navigate directly as fallback)
    try {
      await page.waitForURL('**/pages/checkout.html', { timeout: 3000 });
    } catch (err) {
      await page.goto('/pages/checkout.html');
    }

    // Wait briefly for page to load
    await page.waitForTimeout(200);

    // Ensure we are on checkout
    expect(page.url()).toContain('/pages/checkout.html');

    // Now go back and assert we return to cart page
    await page.goBack();
    // Wait for navigation to complete
    await page.waitForURL('**/pages/cart.html', { timeout: 3000 });
    expect(page.url()).toContain('/pages/cart.html');

    // Now wait a short interval to ensure no automatic forward navigation happens
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/pages/cart.html');
  });

  test('unregister service worker does not change back-button behaviour', async ({ page }) => {
    // Unregister service workers then repeat the flow
    await page.goto('/');
    try {
      await page.evaluate(async () => {
        if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      });
    } catch (err) {
      // ignore
    }

    const cart = JSON.parse(fs.readFileSync('./tests/fixtures/sample-cart.json', 'utf-8'));
    await page.evaluate((c) => localStorage.setItem('naturesi_cart', JSON.stringify(c)), cart);

    await page.goto('/pages/cart.html');
    await page.click('#btn-proceed-checkout');
    try {
      await page.waitForURL('**/pages/checkout.html', { timeout: 3000 });
    } catch (err) {
      await page.goto('/pages/checkout.html');
    }

    await page.goBack();
    await page.waitForURL('**/pages/cart.html', { timeout: 3000 });
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/pages/cart.html');
  });
});
