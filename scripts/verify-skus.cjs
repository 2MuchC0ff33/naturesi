#!/usr/bin/env node
// scripts/verify-skus.cjs
// Verify that data-sku attributes on pages/store match known skus from products.json

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const productsPath = path.join(repoRoot, 'assets', 'js', 'data', 'products.json');
const storeDir = path.join(repoRoot, 'pages', 'store');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8')).products || [];
const knownSkus = new Set(products.map((p) => p.sku));

const files = fs.readdirSync(storeDir).filter((n) => n.endsWith('.html'));
let problems = [];
files.forEach((f) => {
  const fp = path.join(storeDir, f);
  const content = fs.readFileSync(fp, 'utf8');
  const articleRegex = /<article([^>]*)>/gi;
  let match;
  while ((match = articleRegex.exec(content)) !== null) {
    const attrs = match[1];
    const idMatch = /id\s*=\s*"([^"]+)"/i.exec(attrs);
    const id = idMatch ? idMatch[1] : '(no-id)';
    const skuMatch = /data-sku\s*=\s*"([^"]+)"/i.exec(attrs);
    const sku = skuMatch ? skuMatch[1] : null;
    if (!sku) {
      problems.push({ file: f, id, problem: 'missing data-sku' });
    } else if (!knownSkus.has(sku)) {
      problems.push({ file: f, id, sku, problem: 'unknown sku' });
    }
  }
});

if (!problems.length) {
  console.log('All data-sku attributes appear valid and match products.json skus.');
} else {
  console.log('Found SKU issues:');
  problems.forEach((p) => console.log(`${p.file}: ${p.id} -> ${p.problem}${p.sku ? ' (' + p.sku + ')' : ''}`));
}
