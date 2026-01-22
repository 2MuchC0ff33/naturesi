import { describe, it, expect, beforeEach } from 'vitest';
import { saveCartToIDB, loadCartFromIDB } from '../../assets/js/modules/storageIDB.js';

// Provide a fake indexedDB globally (fake-indexeddb is a devDependency available in the repo)
import 'fake-indexeddb/auto';

describe('storageIDB', () => {
  beforeEach(async () => {
    // Clear DB by opening and deleting
    const dbs = indexedDB.databases ? await indexedDB.databases() : [];
    for (const db of dbs) {
      if (db.name && db.name.startsWith('naturesi')) indexedDB.deleteDatabase(db.name);
    }
  });

  it('saves and loads a cart from IndexedDB', async () => {
    const cart = { items: [{ id: 'x', quantity: 2 }] };
    const ok = await saveCartToIDB(cart, 'test-db', 'test-key');
    expect(ok).toBe(true);
    const loaded = await loadCartFromIDB('test-db', 'test-key');
    expect(loaded).toEqual(cart);
  });

  it('returns null when DB missing', async () => {
    const loaded = await loadCartFromIDB('no-such-db', 'nokey');
    // should return null gracefully
    expect(loaded === null || loaded === undefined).toBeTruthy();
  });
});
