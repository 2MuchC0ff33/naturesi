import { test, expect } from '@playwright/test';

test.describe('Header category select', () => {
  test('selecting a category navigates to the category page (JS enabled)', async ({ page }) => {
    // Skip this test in contexts where JS is disabled (Playwright runs JS-off projects too)
    // Prefer checking context options (Playwright projects may run with JS disabled)
    const ctxOptions = (page.context() as any)._options || {};
    const jsEnabled = typeof ctxOptions.javaScriptEnabled === 'boolean' ? ctxOptions.javaScriptEnabled : true;
    if (!jsEnabled) test.skip();

    await page.goto('/');

    const sel = page.locator('#site-category-select');
    await expect(sel).toBeVisible();

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      sel.selectOption('wellness-blends'),
    ]);

    await expect(page).toHaveURL(/.*\/pages\/store\/wellness-blends\.html$/);
    await expect(page.locator('h2#wellness-heading')).toBeVisible();
  });

  test('noscript fallback links to category pages when JS is disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const pageNoJS = await context.newPage();
    await pageNoJS.goto('/');

    const link = pageNoJS.locator('a[href="/pages/store/wellness-blends.html"]');
    await expect(link).toBeVisible();

    // Optionally click and ensure navigation works without JS
    await Promise.all([pageNoJS.waitForNavigation({ waitUntil: 'load' }), link.click()]);
    await expect(pageNoJS).toHaveURL(/.*\/pages\/store\/wellness-blends\.html$/);

    await context.close();
  });
});
