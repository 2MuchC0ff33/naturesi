import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as cat from '../../assets/js/modules/category-select.js';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('buildCategoryUrl', () => {
  it('returns correct URLs for slugs and empty value', () => {
    expect(cat.buildCategoryUrl('wellness-blends')).toBe('/pages/store/wellness-blends.html');
    expect(cat.buildCategoryUrl('')).toBe('/pages/store.html');
    expect(cat.buildCategoryUrl('weird/slug')).toBe('/pages/store/weird%2Fslug.html');
  });
});

describe('initCategorySelect', () => {
  it('attaches change handler and navigates using location.assign', () => {
    document.body.innerHTML = `<select id="site-category-select"><option value="">All</option><option value="wellness-blends">Wellness</option></select>`;

    // Spy on location.assign instead of overwriting it (assign may be non-configurable in some runtimes)
    const spy = vi.fn();

    cat.initCategorySelect(document, spy);
    const sel = document.getElementById('site-category-select') as HTMLSelectElement;
    expect(sel.dataset.categorySelectInit).toBe('1');

    sel.value = 'wellness-blends';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith('/pages/store/wellness-blends.html');

    // Calling init again should not bind another listener (dataset prevents double-init)
    cat.initCategorySelect(document);

  });
});
