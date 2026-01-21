import { test, expect } from '@playwright/test';

// Move visual tests under e2e so Playwright doesn't accidentally load Vitest unit files
test('homepage visual snapshot @visual', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page).toHaveScreenshot({ fullPage: true });
});

test('checkout visual snapshot @visual', async ({ page }) => {
  await page.goto('/pages/checkout.html');
  await expect(page).toHaveScreenshot({ fullPage: true });
});
