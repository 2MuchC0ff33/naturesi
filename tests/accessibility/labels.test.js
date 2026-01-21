import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

function findHtmlFiles(dir) {
  const res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) res.push(...findHtmlFiles(p));
    else if (p.endsWith('.html')) res.push(p);
  }
  return res;
}

test('pages have images with alt and inputs with labels or aria-label', async () => {
  const pagesDir = 'pages';
  // Synchronous helpers used here for simplicity; test runner is node:test
  const files = (await fs.readdir(pagesDir))
    .map((f) => `pages/${f}`)
    .filter((f) => f.endsWith('.html'));
  for (const f of files) {
    const s = await fs.readFile(f, 'utf8');
    // check images have alt or role presentation
    const imgRegex = /<img\s+[^>]*>/gi;
    const imgs = s.match(imgRegex) || [];
    for (const img of imgs) {
      const hasAlt = /alt\s*=\s*"[^"]+"/.test(img);
      const isDecorative = /role\s*=\s*"presentation"/.test(img);
      assert.ok(hasAlt || isDecorative, `Image missing alt or role on page ${f}: ${img}`);
    }
    // check inputs have labels or aria-labels
    const inputRegex = /<(input|select|textarea)\b[^>]*>/gi;
    const inputs = s.match(inputRegex) || [];
    for (const input of inputs) {
      // ignore hidden inputs used for form mechanics
      const isHidden = /type\s*=\s*"hidden"/i.test(input);
      if (isHidden) continue;
      const hasAria = /aria-label\s*=\s*"[^"]+"/.test(input);
      const idMatch = input.match(/id\s*=\s*"([^"]+)"/);
      if (idMatch) {
        const id = idMatch[1];
        const labelRegex = new RegExp(`<label[^>]+for="${id}"`);
        assert.ok(hasAria || labelRegex.test(s), `Input ${id} missing label or aria-label in ${f}`);
      } else {
        assert.ok(hasAria, `Input without id must have aria-label in ${f}: ${input}`);
      }
    }
  }
});
