import { test } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('checkout page should have no critical accessibility violations @a11y', async ({ page }) => {
  await page.goto('/pages/checkout.html');
  await injectAxe(page);
  await checkA11y(page, null, { detailedReport: true, detailedReportOptions: { html: true } });
});
