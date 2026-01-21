#!/usr/bin/env node
// Minimal static file server using Node core modules (no dependencies)
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const portArg = process.argv[2] || process.env.PORT || '8000';
const port = Number(portArg) || 8000;
const root = process.cwd();

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
]);

function contentTypeFrom(filePath) {
  return mime.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let filePath = decodeURIComponent(url.pathname);
    if (filePath === '/') filePath = '/index.html';
    let fsPath = path.join(root, filePath.replace(/^\//, ''));

    // prevent path traversal
    if (!fsPath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    let stat;
    try {
      stat = await fs.stat(fsPath);
      if (stat.isDirectory()) fsPath = path.join(fsPath, 'index.html');
    } catch (e) {
      // try fallback to index.html
      const notFoundPath = path.join(root, '404.html');
      try {
        const body = await fs.readFile(notFoundPath, 'utf8');
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(body);
        return;
      } catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
    }

    const data = await fs.readFile(fsPath);
    res.writeHead(200, { 'Content-Type': contentTypeFrom(fsPath) });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
});

server.listen(port, () => {
  // Friendly message for tests to detect server readiness
  // eslint-disable-next-line no-console
  console.log(`Simple static server running at http://localhost:${port}/`);
});

// Graceful shutdown on SIGINT for test harnesses
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
