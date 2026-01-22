import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLocalCart,
  setLocalCart,
  removeLocalCart,
} from '../../assets/js/modules/storageLocal.js';

describe('storageLocal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('set and get cart via localStorage', () => {
    const cart = { items: [{ id: 'a', quantity: 1 }] };
    expect(setLocalCart(cart, 'test-key')).toBe(true);
    const loaded = getLocalCart('test-key');
    expect(loaded).toEqual(cart);
  });

  it('removeLocalCart removes the key and returns true', () => {
    setLocalCart({ items: [] }, 'test-key');
    expect(removeLocalCart('test-key')).toBe(true);
    expect(getLocalCart('test-key')).toBeNull();
  });

  it('getLocalCart returns null for invalid JSON', () => {
    // create malformed value
    localStorage.setItem('bad', '{not:json');
    expect(getLocalCart('bad')).toBeNull();
  });
});
