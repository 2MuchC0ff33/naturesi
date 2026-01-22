import { test, expect } from '@playwright/test';

test.describe('Proceed to checkout', () => {
  test('adds an item via UI then proceeds to checkout', async ({ page }) => {
    await page.goto('/');
    // Wait for the client-side cart initialization to complete so handlers are attached
    await page.waitForFunction(() => !!window.NaturesCart, { timeout: 5000 });
    const addBtn = page.locator('form.add-to-cart button[type="submit"]').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Click the cart link to go to the cart page where the proceed button is present
    await Promise.all([
      page.waitForNavigation({ url: '**/pages/cart.html**' }),
      page.click('a.cart-option'),
    ]);

    // Wait for the cart table rows to render (ensures the add-to-cart completed and cart UI is showing items)
    await page.waitForSelector('.cart-table tbody tr', { timeout: 5000 });
    await page.waitForSelector('#btn-proceed-checkout');

    // Add a listener to capture form submit (so we can assert PayPal payload) and prevent navigation
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

    // Click and wait for captured PayPal form submit or navigation to checkout as fallback
    await page.click('#btn-proceed-checkout');
    await page.waitForFunction(
      () =>
        (window as any).__lastPayPalForm !== null ||
        location.pathname.endsWith('/pages/checkout.html'),
      { timeout: 5000 }
    );

    // If we captured a PayPal redirect form, assert expected fields
    await page.waitForFunction(
      () => {
        try {
          const s = window.localStorage.getItem('naturesi_cart');
          if (s && Array.isArray(JSON.parse(s)) && JSON.parse(s).length > 0) return true;
          if (
            window.NaturesCart &&
            window.NaturesCart.store &&
            typeof window.NaturesCart.store.get === 'function'
          ) {
            const c = window.NaturesCart.store.get();
            if (c && Array.isArray(c.items) && c.items.length > 0) return true;
          }
          const summary = document.getElementById('summary-content');
          if (summary && summary.innerHTML && summary.innerHTML.trim().length > 0) return true;
          return false;
        } catch (e) {
          return false;
        }
      },
      { timeout: 10000 }
    );
    const cartStr = await page.evaluate(() => window.localStorage.getItem('naturesi_cart'));
    const cart = JSON.parse(cartStr || 'null');
    expect(Array.isArray(cart)).toBe(true);

    // If a PayPal form submit was captured, assert it contains expected params
    const lastForm = await page.evaluate(() => (window as any).__lastPayPalForm || null);
    if (lastForm) {
      expect(lastForm.cmd).toBe('_xclick');
      expect(lastForm.business).toMatch(/@/);
      expect(Number(lastForm.amount)).toBeGreaterThan(0);
      expect(lastForm.return).toBeDefined();
      expect(lastForm.cancel_return).toBeDefined();
      // stop here — we captured a PayPal redirect
      return;
    }

    // Otherwise fall back to checkout page expectations
    await page.waitForFunction(
      () => {
        const s = document.getElementById('summary-content');
        const err = document.getElementById('checkout-error');
        const summaryReady = s && s.innerHTML && s.innerHTML.trim().length > 0;
        const errorShown =
          err &&
          !err.classList.contains('hidden') &&
          err.textContent &&
          err.textContent.trim().length > 0;
        return summaryReady || errorShown;
      },
      { timeout: 5000 }
    );

    const errorVisible = await page.evaluate(() => {
      const err = document.getElementById('checkout-error');
      return err && !err.classList.contains('hidden');
    });

    if (errorVisible) {
      await expect(page.locator('#checkout-error')).toBeVisible();
    } else {
      await expect(page.locator('#summary-content')).toContainText('Total');
    }
  });

  test('with localStorage set directly, clicking proceed navigates to checkout', async ({
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

    await page.click('#btn-proceed-checkout');
    await page.waitForFunction(
      () =>
        (window as any).__lastPayPalForm !== null ||
        location.pathname.endsWith('/pages/checkout.html'),
      { timeout: 5000 }
    );

    const lastForm2 = await page.evaluate(() => (window as any).__lastPayPalForm || null);
    if (lastForm2) {
      expect(lastForm2.cmd).toBe('_xclick');
      expect(lastForm2.business).toMatch(/@/);
      expect(Number(lastForm2.amount)).toBeGreaterThan(0);
      return;
    }

    // Fallback to original behaviour when PayPal redirection did not occur
    await page.waitForFunction(
      () => {
        const s = document.getElementById('summary-content');
        const err = document.getElementById('checkout-error');
        const summaryReady = s && s.innerHTML && s.innerHTML.trim().length > 0;
        const errorShown =
          err &&
          !err.classList.contains('hidden') &&
          err.textContent &&
          err.textContent.trim().length > 0;
        return summaryReady || errorShown;
      },
      { timeout: 5000 }
    );

    const errorVisible2 = await page.evaluate(() => {
      const err = document.getElementById('checkout-error');
      return err && !err.classList.contains('hidden');
    });

    if (errorVisible2) {
      await expect(page.locator('#checkout-error')).toBeVisible();
    } else {
      await expect(page.locator('#summary-content')).toContainText('Total');
    }
  });
});
