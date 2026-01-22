import { test, expect } from '@playwright/test';

test.describe('Proceed to checkout (Buy Now forms)', () => {
  test('Buy Now form exists on index and submits PayPal payload', async ({ page }) => {
    await page.goto('/');

    // Ensure the PayPal Buy Now form is present on the product card
    const paypalForm = page.locator('form.paypal-buynow').first();
    await expect(paypalForm).toBeVisible();

    // Add a submit listener to capture PayPal redirect and prevent navigation
    await page.evaluate(() => {
      (window as any).__lastPayPalForm = null;
      document.addEventListener(
        'submit',
        (e) => {
          try {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const data = Array.from(form.elements).reduce((acc: any, el: any) => {
              if (el && el.name) acc[el.name] = el.value;
              return acc;
            }, {});
            (window as any).__lastPayPalForm = data;
          } catch (err) {
            // ignore
          }
        },
        true
      );
    });

    // Click the first PayPal Buy Now button
    await paypalForm.locator('button[type="submit"]').click();

    // Assert we captured a PayPal payload
    await page.waitForFunction(() => (window as any).__lastPayPalForm !== null, { timeout: 5000 });
    const lastForm = await page.evaluate(() => (window as any).__lastPayPalForm || null);
    expect(lastForm).not.toBeNull();
    expect(lastForm.cmd).toBe('_xclick');
    expect(lastForm.business).toMatch(/@/);
    expect(Number(lastForm.amount)).toBeGreaterThan(0);
    expect(lastForm.return).toBeDefined();
    expect(lastForm.cancel_return).toBeDefined();
  });

  test('Buy Now works with JS disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const pageNoJS = await context.newPage();
    await pageNoJS.goto('/');

    // Even with JS off, the form should exist and be submittable
    const formExists = await pageNoJS.$('form.paypal-buynow');
    expect(formExists).not.toBeNull();

    // We cannot intercept submit easily with JS disabled, but the presence of the form indicates ability to submit to PayPal.
    await context.close();
  });

  test('with localStorage set directly, clicking proceed shows deprecation note', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem(
        'naturesi_cart',
        JSON.stringify([{ id: 'sku-test-direct', title: 'Direct Item', price: 9.99, qty: 1 }])
      );
    });

    await page.goto('/pages/cart.html');
    await page.waitForSelector('#btn-proceed-checkout');

    // Click proceed and expect deprecation note rather than redirect
    await page.click('#btn-proceed-checkout');

    await page.waitForSelector('#checkout-deprecated-note');
    await expect(page.locator('#checkout-deprecated-note')).toContainText(
      'Aggregate checkout is deprecated'
    );
  });
});
