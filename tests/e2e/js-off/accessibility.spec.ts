import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const PAGES = [
  '/index.html',
  '/pages/store.html',
  '/pages/cart.html',
  '/pages/contact.html',
  '/pages/checkout.html',
];

test.describe('JS-disabled accessibility checks @a11y', () => {
  for (const p of PAGES) {
    test(`a11y scan ${p}`, async ({ page }) => {
      await page.goto(p);
      await injectAxe(page);
      // Fail on any violations with impact 'critical' or 'serious'
      const results: any = await checkA11y(page, undefined, {
        detailedReport: true,
        axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
      });
      expect(
        results.violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length
      ).toBe(0);
    });
  }
});
