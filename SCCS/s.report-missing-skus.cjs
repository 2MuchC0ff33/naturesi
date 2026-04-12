h30523
s 00033/00000/00000
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
// scripts/report-missing-skus.cjs
// Reports product articles in pages/store that lack data-sku attributes

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const storeDir = path.join(repoRoot, 'pages', 'store');

const files = fs.readdirSync(storeDir).filter((n) => n.endsWith('.html'));
let missing = [];
files.forEach((f) => {
  const fp = path.join(storeDir, f);
  const content = fs.readFileSync(fp, 'utf8');
  const articleRegex = /<article([^>]*)>/gi;
  let match;
  while ((match = articleRegex.exec(content)) !== null) {
    const attrs = match[1];
    const idMatch = /id\s*=\s*"([^"]+)"/i.exec(attrs);
    const id = idMatch ? idMatch[1] : '(no-id)';
    if (!/data-sku\s*=/.test(attrs)) {
      missing.push({ file: f, id });
    }
  }
});

if (!missing.length) {
  console.log('All product article tags have data-sku attributes.');
} else {
  console.log('Articles missing data-sku:');
  missing.forEach((m) => console.log(`${m.file}: ${m.id}`));
}
E 1
