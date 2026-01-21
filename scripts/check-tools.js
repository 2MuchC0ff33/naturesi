#!/usr/bin/env node
// Check presence of optional tools. Exit 0 if all available, else exit 1.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const toolsDir = new URL('../.tools/', import.meta.url);

function findInTools(filenames) {
  const root = new URL('../.tools/', import.meta.url).pathname;
  const queue = [root];
  const seen = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (seen.has(cur)) continue;
    seen.add(cur);
    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch (e) {
      continue;
    }
    for (const ent of entries) {
      const p = `${cur}${process.platform === 'win32' ? '\\' : '/'}${ent.name}`;
      if (ent.isFile()) {
        for (const f of filenames) {
          if (ent.name.toLowerCase() === f.toLowerCase()) return true;
        }
      } else if (ent.isDirectory()) {
        queue.push(p);
      }
    }
  }
  return false;
}

const checks = [
  {
    name: 'zombie (npm module)',
    check: () => {
      try {
        return Boolean(require.resolve('zombie'));
      } catch (e) {
        return false;
      }
    },
  },
  {
    name: 'wkhtmltox (portable binary)',
    check: () =>
      findInTools(['wkhtmltoimage.exe', 'wkhtmltoimage', 'wkhtmltopdf.exe', 'wkhtmltopdf']),
  },
  {
    name: 'quickjs (portable)',
    check: () => findInTools(['qjs.exe', 'qjs']),
  },
];

let allGood = true;
for (const c of checks) {
  const ok = c.check();
  console.log(`${ok ? '✓' : '✗'} ${c.name}`);
  if (!ok) allGood = false;
}
process.exit(allGood ? 0 : 1);
