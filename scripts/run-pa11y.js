#!/usr/bin/env node
// Lightweight helper to start a simple python http.server, run pa11y for a list of pages
// and write HTML reports to pa11y-reports/. Designed to be run from the repo root via npm.
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'pa11y-reports');

const pages = [
  '/',
  '/index.html',
  '/pages/about.html',
  '/pages/terms.html',
  '/pages/contact.html',
  '/pages/social.html',
  '/pages/stockists.html',
  '/pages/search.html',
  '/pages/store.html',
  '/pages/store/accessories.html',
  '/pages/store/artisan-blends.html',
  '/pages/store/balms.html',
  '/pages/store/black-tea.html',
  '/pages/store/creams.html',
  '/pages/store/green-tea.html',
  '/pages/store/herbal-infusions.html',
  '/pages/store/ice-tea.html',
  '/pages/store/selfcare.html',
  '/pages/store/wellness-blends.html',
  '/pages/search/accessories.html',
  '/pages/search/artisan-blends.html',
  '/pages/search/balms.html',
  '/pages/search/black-tea.html',
  '/pages/search/creams.html',
  '/pages/search/green-tea.html',
  '/pages/search/herbal-infusions.html',
  '/pages/search/ice-tea.html',
  '/pages/search/selfcare.html',
  '/pages/search/wellness-blends.html',
];

function ensureReportDir() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function run() {
  ensureReportDir();

  console.log('Starting local server: python -m http.server', PORT);
  const server = spawn('python', ['-m', 'http.server', String(PORT)], { stdio: 'ignore' });

  // Give the server a moment to start
  const waitMs = 1500;
  console.log(`Waiting ${waitMs}ms for server to start...`);
  setTimeout(() => {
    try {
      pages.forEach((p) => {
        const url = `http://${HOST}:${PORT}${p}`;
        const name = (p === '/' ? 'index' : path.basename(p)).replace(/\W+/g, '-') + '.html';
        const out = path.join(REPORT_DIR, name);
        console.log('Running pa11y for', url);
        try {
          // Use npx to run pa11y so users don't need to install globally
          execSync(`npx pa11y "${url}" --reporter html > "${out}"`);
        } catch (err) {
          // pa11y may exit with non-zero when issues found; still produce the report and continue
          console.warn(`pa11y finished with non-zero exit for ${url} (report saved to ${out})`);
        }
      });
    } finally {
      try {
        // Kill the python server we started
        server.kill();
      } catch (e) {
        // ignore
      }
      console.log('Finished pa11y runs. Reports written to pa11y-reports/');
    }
  }, waitMs);
}

run();
