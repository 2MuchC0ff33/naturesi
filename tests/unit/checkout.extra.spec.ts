import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPayPalConfig, toAbsoluteUrl } from '../../assets/js/modules/checkout.js';

describe('checkout utils (extra)', () => {
  beforeEach(() => {
    // reset fetch mock
    globalThis.fetch = undefined;
  });

  it('loadPayPalConfig retries and returns config when available', async () => {
    // simulate failing then success
    let calls = 0;
    globalThis.fetch = vi.fn(async (path) => {
      calls++;
      if (calls === 1) throw new Error('network');
      return {
        ok: true,
        json: async () => ({ business: 'a@b.com', env: 'sandbox', sandbox_url: 'https://s' }),
      };
    }) as unknown as typeof fetch;

    const res = await loadPayPalConfig('/assets/js/data/paypal.json', 1);
    expect(res).toEqual(expect.objectContaining({ business: 'a@b.com' }));
  });

  it('toAbsoluteUrl handles protocol-relative and absolute URLs', () => {
    globalThis.location = { origin: 'https://example.com' } as any;
    expect(toAbsoluteUrl('//cdn.example.com/js')).toBe('//cdn.example.com/js');
    expect(toAbsoluteUrl('https://a.b/c')).toBe('https://a.b/c');
    expect(toAbsoluteUrl('/foo')).toBe('https://example.com/foo');
  });

  it('loadPayPalConfig returns null on persistent failure', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;
    const res = await loadPayPalConfig('/assets/js/data/paypal.json', 1);
    expect(res).toBeNull();
  });
});
