import { test, expect } from '@playwright/test';

test('keyboard-only navigation focuses skip link then main landmarks', async ({ page }) => {
  await page.goto('/index.html');
  // Press Tab until skip link is focused
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(
    () => document.activeElement && document.activeElement.className
  );
  // skip-link should be first tabbable element
  expect(focused).toContain('skip-link');
  // Press Enter to follow skip link and ensure focus lands on main
  await page.keyboard.press('Enter');
  const active = await page.evaluate(() => document.activeElement && document.activeElement.id);
  expect(active).toBe('main-content');
});
