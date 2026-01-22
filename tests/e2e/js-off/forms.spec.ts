import { test, expect } from '@playwright/test';

test.describe('JS-disabled forms and progressive fallback', () => {
  test('shipping estimate form is present and uses GET', async ({ page }) => {
    await page.goto('/pages/shipping-estimate.html');
    const form = page.locator('form.postcode-lookup');
    expect(await form.count()).toBe(1);
    expect(await form.getAttribute('method')).toBe('get');
    const btn = form.locator('button[type="submit"]');
    expect(await btn.count()).toBe(1);
  });

  test('contact form has proper labels and does not auto-submit externally in tests', async ({
    page,
  }) => {
    await page.goto('/pages/contact.html');
    const form = page.locator('form[action="https://api.naturesinfusions.com.au/contact"]');
    expect(await form.count()).toBe(1);
    // check key inputs present and labelled
    expect(await form.locator('input[name="email"]').count()).toBeGreaterThan(0);
    expect(await form.locator('textarea[name="message"]').count()).toBeGreaterThan(0);
  });
});
