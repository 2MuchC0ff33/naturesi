import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

const URLS = [
  { url: 'http://127.0.0.1:8080/index.html', name: 'index' },
  { url: 'http://127.0.0.1:8080/pages/checkout.html', name: 'checkout' },
];

const REPORT_DIR = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

(async () => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  try {
    for (const p of URLS) {
      console.log('Running Lighthouse for', p.url);
      const result = await lighthouse(p.url, { port: chrome.port, output: 'html' });
      const lhr = result.lhr;
      const html = result.report || '';
      const json = JSON.stringify(lhr, null, 2);
      const htmlPath = path.join(REPORT_DIR, `lighthouse-${p.name}.html`);
      const jsonPath = path.join(REPORT_DIR, `lighthouse-${p.name}.json`);
      fs.writeFileSync(htmlPath, html);
      fs.writeFileSync(jsonPath, json);

      console.log(`${p.name} scores:`);
      for (const [k, v] of Object.entries(lhr.categories)) {
        console.log(`  ${k}: ${Math.round(v.score * 100) || 0}`);
      }

      // Collect low-score audits to review
      const issues = [];
      for (const [id, audit] of Object.entries(lhr.audits || {})) {
        if (audit.score !== null && typeof audit.score === 'number' && audit.score < 0.5) {
          issues.push({ id, title: audit.title, score: audit.score, details: audit.details });
        }
      }

      if (issues.length) {
        console.error(`Found ${issues.length} low-score audits for ${p.name}:`);
        for (const it of issues) console.error(` - ${it.id}: ${it.title} (score ${it.score})`);
      } else {
        console.log('No major low-score audits found for', p.name);
      }
    }
    console.log('Lighthouse full audits complete. Reports in ./reports/');
  } finally {
    await chrome.kill();
  }
})();
