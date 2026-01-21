import { test, expect } from '@playwright/test';

test('service worker registers on localhost', async ({ page }) => {
  await page.goto('/');
  const hasSW = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    } catch (e) {
      return false;
    }
  });
  expect(hasSW).toBe(true);
});
