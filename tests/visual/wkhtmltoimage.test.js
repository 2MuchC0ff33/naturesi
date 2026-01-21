import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const hasWk = (() => {
  try {
    const res = spawnSync('node', ['scripts/check-tools.js'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return res.status === 0;
  } catch (e) {
    return false;
  }
})();

if (!hasWk) {
  test.skip('wkhtmltox not installed; visual print tests skipped', () => {});
} else {
  test('wkhtmltoimage renders checkout harness to image (smoke)', async () => {
    // Implement simple smoke to call wkhtmltox exe on harness (left as smoke - no assertions on pixels)
    // This test assumes .tools/wkhtmltox-0.12.6-1.msvc2015-win64.exe is present and will be called via child_process.
    const { spawn } = await import('node:child_process');
    const exe = '.tools/wkhtmltox-0.12.6-1.msvc2015-win64.exe';
    const out = '.tools/checkout.png';
    const args = ['http://localhost:8000/tests/html/checkout-harness.html', out];
    const proc = spawn(exe, args, { stdio: 'ignore' });
    await new Promise((res, rej) => {
      proc.on('close', (c) => (c === 0 ? res() : rej(new Error('wkhtmltox failed'))));
    });
    const exists = require('node:fs').existsSync(out);
    assert.ok(exists, 'rendered image should exist');
  });
}
