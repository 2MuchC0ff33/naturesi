import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { collect, attachFormHandler } from '../../assets/js/modules/cart';

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('cart.js', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`
      <html>
        <body>
          <form id="confirm-cart-form">
            <button id="btn-proceed-checkout" type="submit">Proceed to Checkout</button>
          </form>
          <table class="cart-table">
            <tbody>
              <tr data-product-id="1" data-price="10.00" data-qty="2">
                <td class="item-title">Product 1</td>
                <td class="unit-price">$10.00</td>
                <td><input type="number" value="2" /></td>
              </tr>
              <tr data-product-id="2" data-price="20.00" data-qty="1">
                <td class="item-title">Product 2</td>
                <td class="unit-price">$20.00</td>
                <td><input type="number" value="1" /></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    document = dom.window.document;
    global.localStorage = mockLocalStorage;
    mockLocalStorage.clear();
  });

  it('collect() should return normalized cart items from DOM', () => {
    const cart = collect({ documentRoot: document });
    expect(cart).toEqual([
      { id: '1', title: 'Product 1', price: 10, qty: 2 },
      { id: '2', title: 'Product 2', price: 20, qty: 1 },
    ]);
  });

  it('attachFormHandler() should persist cart to localStorage on form submit', () => {
    attachFormHandler({ documentRoot: document, storage: mockLocalStorage });

    const form = document.getElementById('confirm-cart-form');
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));

    const savedCart = JSON.parse(mockLocalStorage.getItem('naturesi_cart'));
    expect(savedCart).toEqual([
      { id: '1', title: 'Product 1', price: 10, qty: 2 },
      { id: '2', title: 'Product 2', price: 20, qty: 1 },
    ]);
  });

  it('attachFormHandler() should persist cart and navigate on button click', () => {
    const mockLocation = { assign: vi.fn() };
    global.location = mockLocation;

    attachFormHandler({ documentRoot: document, storage: mockLocalStorage });

    const button = document.getElementById('btn-proceed-checkout');
    button.dispatchEvent(new dom.window.Event('click', { bubbles: true, cancelable: true }));

    const savedCart = JSON.parse(mockLocalStorage.getItem('naturesi_cart'));
    expect(savedCart).toEqual([
      { id: '1', title: 'Product 1', price: 10, qty: 2 },
      { id: '2', title: 'Product 2', price: 20, qty: 1 },
    ]);
    expect(mockLocation.assign).toHaveBeenCalledWith('/pages/checkout.html');
  });
});
