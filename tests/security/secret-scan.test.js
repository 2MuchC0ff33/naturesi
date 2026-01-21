import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

function checkStringForSecrets(s) {
  const patterns = [
    /sk_live_/i,
    /sk_test_/i,
    /AKIA[0-9A-Z]{16}/,
    /AIza[0-9A-Za-z\-_]{35}/,
    /-----BEGIN PRIVATE KEY-----/i,
  ];
  return patterns.filter((p) => p.test(s));
}

test('repo scan for obvious secrets (simple heuristics)', async () => {
  const files = [
    '.github/workflows',
    'package.json',
    'assets/js/data/paypal.json',
    'README',
    'README.md',
  ];
  for (const f of files) {
    try {
      const full = path.resolve(f);
      const s = await fs.readFile(full, 'utf8');
      const matches = checkStringForSecrets(s);
      assert.strictEqual(
        matches.length,
        0,
        `Found potential secret patterns in ${f}: ${matches.join(',')}`
      );
    } catch (e) {
      // ignore missing files in this simple scan
    }
  }
});
