import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';

const port = 8002;
const harnessPath = '/tests/html/checkout-harness.html';

async function waitForServer(port, timeout = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get({ hostname: 'localhost', port, path: '/' }, (res) => resolve())
        .on('error', (err) => {
          if (Date.now() - start > timeout) return reject(new Error('server did not start'));
          setTimeout(tryOnce, 100);
        });
    };
    tryOnce();
  });
}

async function withServer(fn) {
  const proc = spawn(process.execPath, ['scripts/serve.js', String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await waitForServer(port, 8000);
    return await fn();
  } finally {
    // Cross-platform termination
    proc.kill();
    await new Promise((res) => proc.once('close', res));
  }
}

// Use Zombie (headless browser) to load the harness and execute scripts.
const hasZombie = await (async () => {
  try {
    await import('zombie');
    return true;
  } catch (e) {
    return false;
  }
})();

const hasJsdom = await (async () => {
  try {
    await import('jsdom');
    return true;
  } catch (e) {
    return false;
  }
})();

if (!hasJsdom && !hasZombie) {
  test.skip(
    'integration: harness computes payload from localStorage (no headless runner available)'
  );
} else if (hasJsdom) {
  // Prefer jsdom where available — more stable in CI and avoids binding issues on Windows
  test('integration: harness computes payload from localStorage (jsdom)', async () => {
    const { JSDOM } = await import('jsdom');
    await withServer(async () => {
      // fetch HTML
      const html = await new Promise((resolve, reject) => {
        http
          .get({ hostname: 'localhost', port, path: harnessPath }, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => resolve(data));
          })
          .on('error', reject);
      });
      const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        resources: 'usable',
        url: `http://localhost:${port}${harnessPath}`,
      });
      // wait for script execution and DOM updates
      await new Promise((res, rej) => {
        const start = Date.now();
        (function check() {
          const out = dom.window.document.getElementById('test-output');
          if (out && out.textContent && out.textContent.trim()) return res();
          if (Date.now() - start > 5000)
            return rej(new Error('Harness did not populate output in time'));
          setTimeout(check, 50);
        })();
      });
      const out = dom.window.document.getElementById('test-output');
      const txt = out.textContent.trim();
      const parsed = JSON.parse(txt);
      assert.ok(Array.isArray(parsed.errors) && parsed.errors.length === 0);
      const total = (9.95 * 2 + 6.5).toFixed(2);
      assert.strictEqual(parsed.payload.amount, total);
    });
  });
} else if (hasZombie) {
  test('integration: harness computes payload from localStorage (zombie)', async () => {
    const { default: Browser, Browser: B } = await import('zombie');
    await withServer(async () => {
      const browser = new Browser({ site: `http://localhost:${port}` });
      await browser.visit(harnessPath);
      // ensure the harness had a chance to run
      await browser.wait();
      const out = browser.document.getElementById('test-output');
      assert.ok(out, 'Harness output element missing');
      const txt = out.textContent.trim();
      assert.ok(txt, 'Harness did not render output');
      const parsed = JSON.parse(txt);
      assert.ok(Array.isArray(parsed.errors) && parsed.errors.length === 0);
      const total = (9.95 * 2 + 6.5).toFixed(2);
      assert.strictEqual(parsed.payload.amount, total);
    });
  });
}
