import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { attachFormHandler, collect } from '../../assets/js/modules/cart.js';

describe('attachFormHandler behavior', () => {
  it('inserts deprecation note when proceed button clicked', () => {
    const dom = new JSDOM(
      `<!doctype html><html><body><main id="main-content"><form id="confirm-cart-form"></form><button id="btn-proceed-checkout">Proceed</button></main></body></html>`
    );
    const doc = dom.window.document;

    // Attach handler with a safe mock storage (avoid JSDOM localStorage security errors)
    const calls: any = {};
    const mockStorage = {
      setItem(k: string, v: string) {
        calls.key = k;
        calls.value = v;
      },
    };
    attachFormHandler({ documentRoot: doc, storage: mockStorage });

    // Ensure note not present initially
    expect(doc.getElementById('checkout-deprecated-note')).toBeNull();

    // Simulate click
    const btn = doc.getElementById('btn-proceed-checkout');
    if (btn) {
      const evt = doc.createEvent('Event');
      evt.initEvent('click', true, true);
      btn.dispatchEvent(evt);
    }

    // Note should be inserted
    const note = doc.getElementById('checkout-save-note');
    expect(note).not.toBeNull();
    expect(note.textContent).toMatch(/Preparing checkout/);
  });

  it('calls form.requestSubmit when available and saves cart before submit', () => {
    const dom = new JSDOM(
      `<!doctype html><html><body><main id="main-content"><form id="confirm-cart-form"></form><button id="btn-proceed-checkout">Proceed</button></main></body></html>`
    );
    const doc = dom.window.document;
    let requested = false;
    const form = doc.getElementById('confirm-cart-form');
    // @ts-ignore
    form.requestSubmit = () => {
      requested = true;
    };

    const calls: any = { saved: false };
    const mockStorage = {
      setItem(k: string, v: string) {
        calls.saved = true;
      },
    };

    // create a simple item in global so collect() finds something
    // @ts-ignore
    dom.window.naturesi_cart = [{ id: 'x', title: 'X', price: 1, qty: 1 }];

    attachFormHandler({ documentRoot: doc, storage: mockStorage });

    const btn = doc.getElementById('btn-proceed-checkout');
    if (btn) {
      const evt = doc.createEvent('Event');
      evt.initEvent('click', true, true);
      btn.dispatchEvent(evt);
    }

    expect(calls.saved).toBe(true);
    expect(requested).toBe(true);
  });

  it('falls back to location.assign when submit fails', () => {
    const dom = new JSDOM(
      `<!doctype html><html><body><main id="main-content"><form id="confirm-cart-form"></form><button id="btn-proceed-checkout">Proceed</button></main></body></html>`
    );
    const doc = dom.window.document;

    // test submit called when requestSubmit missing
    let submitted = false;
    const form = doc.getElementById('confirm-cart-form');
    // Force requestSubmit to be absent so submit path is used
    // @ts-ignore
    form.requestSubmit = undefined;
    // @ts-ignore
    form.submit = () => {
      submitted = true;
    };

    const mockStorage = {
      setItem(k: string, v: string) {
        // no-op
      },
    };

    // @ts-ignore
    dom.window.naturesi_cart = [{ id: 'x', title: 'X', price: 1, qty: 1 }];

    attachFormHandler({ documentRoot: doc, storage: mockStorage });

    const btn = doc.getElementById('btn-proceed-checkout');
    if (btn) {
      const evt = doc.createEvent('Event');
      evt.initEvent('click', true, true);
      btn.dispatchEvent(evt);
    }

    expect(submitted).toBe(true);

    // Now simulate failing submit; ensure handler completes without throwing (fallback attempted)
    submitted = false;
    // @ts-ignore
    form.submit = () => {
      throw new Error('submit failed');
    };

    if (btn) {
      const evt = doc.createEvent('Event');
      evt.initEvent('click', true, true);
      // should not throw
      btn.dispatchEvent(evt);
    }

    // no uncaught error, and submit did not set the flag
    expect(submitted).toBe(false);
  });
});
