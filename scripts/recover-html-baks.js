#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
  const results = [];
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      results.push(...getHtmlFiles(file));
    } else if (stat.isFile() && file.endsWith('.html')) {
      results.push(file);
    }
  }
  return results;
}

function isCorrupted(content) {
  // Detect patterns like '< attr="...">' (missing tag name after '<')
  return /<\s+[a-zA-Z0-9:_-]+\s*=/.test(content);
}

function main() {
  const root = path.resolve(__dirname, '..');
  const files = getHtmlFiles(root);
  let restored = 0;
  for (const f of files) {
    const bak = f + '.bak';
    try {
      const src = fs.readFileSync(f, 'utf8');
      if (isCorrupted(src) && fs.existsSync(bak)) {
        fs.copyFileSync(bak, f);
        console.log('restored from bak:', f);
        restored++;
      }
    } catch (e) {
      // ignore read errors
    }
  }
  console.log('recovery complete, files restored:', restored);
}

main();
