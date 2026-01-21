import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';

const port = 8002;
const harnessPath = '/tests/html/checkout-harness.html';

async function fetchText(path) {
  return new Promise((resolve, reject) => {
    http
      .get({ hostname: 'localhost', port, path }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      })
      .on('error', reject);
  });
}

function waitForServer(port, timeout = 5000) {
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

test('integration: harness computes payload from localStorage', async () => {
  await withServer(async () => {
    const res = await fetchText(harnessPath);
    assert.strictEqual(res.status, 200);
    // extract JSON string from <pre id="test-output">...</pre>
    const match = res.body.match(/<pre[^>]*id=["']test-output["'][^>]*>([\s\S]*?)<\/pre>/i);
    assert.ok(match, 'Harness did not render output');
    const parsed = JSON.parse(match[1].trim());
    assert.ok(Array.isArray(parsed.errors) && parsed.errors.length === 0);
    const total = (9.95 * 2 + 6.5).toFixed(2);
    assert.strictEqual(parsed.payload.amount, total);
  });
});
