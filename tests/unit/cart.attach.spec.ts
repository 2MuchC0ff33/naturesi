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
    const note = doc.getElementById('checkout-deprecated-note');
    expect(note).not.toBeNull();
    expect(note.textContent).toMatch(/Aggregate checkout is deprecated/);
  });
});
