import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import fs from 'fs';

const PAYPAL = JSON.parse(fs.readFileSync('./tests/fixtures/paypal.json', 'utf-8'));
const SAMPLE_CART = JSON.parse(fs.readFileSync('./tests/fixtures/sample-cart.json', 'utf-8'));

test('JS-enabled checkout accessibility scan @a11y', async ({ page }) => {
  // set cart, route paypal
  await page.route('**/assets/js/data/paypal.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PAYPAL) })
  );
  await page.goto('/');
  await page.evaluate((c) => localStorage.setItem('naturesi_cart', JSON.stringify(c)), SAMPLE_CART);
  await page.goto('/pages/checkout.html');
  await page.evaluate(async () => {
    const p = '/assets/js/modules/' + 'checkout.js';
    const m = await import(p as any);
    await m.runCheckout({ fetchPath: '/assets/js/data/paypal.json' });
  });

  await injectAxe(page);
  const results: any = await checkA11y(page, undefined, { detailedReport: true });
  expect(
    results.violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length
  ).toBe(0);
});
