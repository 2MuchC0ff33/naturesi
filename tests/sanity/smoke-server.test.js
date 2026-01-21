import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';

function waitForServer(port, timeout = 8000) {
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

test('start server and serve checkout page', async () => {
  const port = 8001;
  const proc = spawn(process.execPath, ['scripts/serve.js', String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServer(port, 10000);

    const body = await new Promise((resolve, reject) => {
      http
        .get({ hostname: 'localhost', port, path: '/pages/checkout.html' }, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve({ status: res.statusCode, body: data }));
        })
        .on('error', reject);
    });

    assert.strictEqual(body.status, 200);
    assert.ok(body.body.includes('<title>Checkout — Pay with PayPal</title>'));
  } finally {
    proc.kill();
    await new Promise((res) => proc.once('close', res));
  }
});
