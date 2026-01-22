import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

const URLS = [
  { url: 'http://127.0.0.1:8080/index.html', name: 'index' },
  { url: 'http://127.0.0.1:8080/pages/checkout.html', name: 'checkout' },
];

const BUDGETS = {
  LCP: 2500, // ms
  TBT: 300, // ms
  CLS: 0.1,
};

(async () => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  try {
    for (const p of URLS) {
      const result = await lighthouse(p.url, {
        port: chrome.port,
        onlyCategories: ['performance'],
      });
      const lh = result.lhr;
      const metrics = lh.audits['largest-contentful-paint']?.numericValue || 0;
      const tbt = lh.audits['total-blocking-time']?.numericValue || 0;
      const cls = lh.audits['cumulative-layout-shift']?.numericValue || 0;

      console.log(`${p.name} LCP=${metrics} TBT=${tbt} CLS=${cls}`);
      if (metrics > BUDGETS.LCP || tbt > BUDGETS.TBT || cls > BUDGETS.CLS) {
        console.error('Performance budgets exceeded for', p.name);
        process.exit(2);
      }
    }
    console.log('All performance smoke checks passed');
  } finally {
    await chrome.kill();
  }
})();
