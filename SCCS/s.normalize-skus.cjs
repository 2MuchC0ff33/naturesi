h06395
s 00068/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/usr/bin/env node
// scripts/normalize-skus.cjs
// Scans pages/store/*.html and injects/normalizes data-sku attributes on product <article> elements

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const productsPath = path.join(repoRoot, 'assets', 'js', 'data', 'products.json');
const storeDir = path.join(repoRoot, 'pages', 'store');

function loadProducts() {
  const txt = fs.readFileSync(productsPath, 'utf8');
  const json = JSON.parse(txt);
  const map = new Map();
  (json.products || []).forEach((p) => {
    if (p && p.name && p.sku) {
      map.set((p.name || '').trim().toLowerCase(), p.sku);
      if (p.id) map.set(p.id.trim().toLowerCase(), p.sku);
      if (p.sku) map.set(p.sku.trim().toLowerCase(), p.sku);
    }
  });
  return map;
}

function processFile(filePath, nameToSku) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const articleRegex = /(<article[^>]*>)([\s\S]*?)(?:<h3[^>]*>([^<]+)<\/h3>|<h4[^>]*>([^<]+)<\/h4>)/gi;
  content = content.replace(articleRegex, (match, opening, body, h3Name, h4Name) => {
    const name = (h3Name || h4Name || '').trim();
    if (!name) return match;
    const key = name.toLowerCase();
    const sku = nameToSku.get(key);
    if (!sku) return match;

    if (/data-sku\s*=/.test(opening)) {
      const newOpening = opening.replace(/data-sku\s*=\s*"[^"]*"/, `data-sku="${sku}"`);
      if (newOpening !== opening) changed = true;
      return newOpening + body + (h3Name ? `<h3>${h3Name}</h3>` : `<h4>${h4Name}</h4>`);
    } else {
      const idx = opening.lastIndexOf('>');
      const newOpening = opening.slice(0, idx) + ` data-sku="${sku}"` + opening.slice(idx);
      changed = true;
      return newOpening + body + (h3Name ? `<h3>${h3Name}</h3>` : `<h4>${h4Name}</h4>`);
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  return changed;
}

function main() {
  const map = loadProducts();
  const files = fs.readdirSync(storeDir).filter((n) => n.endsWith('.html'));
  const summary = [];
  files.forEach((f) => {
    const filePath = path.join(storeDir, f);
    const changed = processFile(filePath, map);
    summary.push({ file: f, changed });
  });
  console.log('normalize-skus summary:');
  summary.forEach((s) => console.log(`${s.changed ? 'UPDATED' : 'skipped'} ${s.file}`));
}

main();
E 1
