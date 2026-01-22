import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

const URLS = [
  { url: 'http://127.0.0.1:8080/index.html', name: 'index' },
  { url: 'http://127.0.0.1:8080/pages/store.html', name: 'store' },
  { url: 'http://127.0.0.1:8080/pages/checkout.html', name: 'checkout' },
];

const REPORT_DIR = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

(async () => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  try {
    for (const p of URLS) {
      console.log('Running Lighthouse on', p.url);
      const result = await lighthouse(p.url, {
        port: chrome.port,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        output: 'html',
      });
      const lhr = result.lhr;

      const jsonPath = path.join(REPORT_DIR, `lighthouse-${p.name}.json`);
      const htmlPath = path.join(REPORT_DIR, `lighthouse-${p.name}.html`);
      fs.writeFileSync(jsonPath, JSON.stringify(lhr, null, 2), 'utf8');

      // Generate a simple HTML report using lighthouse's report generator
      try {
        const reportHtml = result.report; // by default using json output returns report too
        fs.writeFileSync(htmlPath, reportHtml, 'utf8');
      } catch (e) {
        // Fallback: create a minimal HTML summary
        const summary = `<html><body><h1>Lighthouse report: ${p.name}</h1><pre>${JSON.stringify(
          { score: lhr.categories },
          null,
          2
        )}</pre></body></html>`;
        fs.writeFileSync(htmlPath, summary, 'utf8');
      }

      console.log(`Saved reports: ${jsonPath}, ${htmlPath}`);

      // Quick checks to fail CI on very poor scores
      const perfScore = Math.round((lhr.categories.performance.score || 0) * 100);
      const a11yScore = Math.round((lhr.categories.accessibility.score || 0) * 100);
      console.log(`${p.name} scores — Performance: ${perfScore}, Accessibility: ${a11yScore}`);

      if (perfScore < 50 || a11yScore < 80) {
        console.error('Lighthouse critical thresholds breached for', p.name);
        // Do not exit here — we will collect all reports and then fail with non-zero
        process.exitCode = 2;
      }
    }
  } finally {
    await chrome.kill();
  }
})();
