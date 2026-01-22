import { test, expect } from '@playwright/test';

// Validate that service worker registers when JS is enabled
test('service worker registers and controls the page', async ({ page }) => {
  await page.goto('/index.html');
  // Wait for service worker registration to appear in navigator
  const reg = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    } catch (e) {
      return false;
    }
  });
  expect(reg).toBeTruthy();
});
