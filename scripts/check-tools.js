#!/usr/bin/env node
// Check presence of optional tools. Exit 0 if all available, else exit 1.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const toolsDir = new URL('../.tools/', import.meta.url);
import { join } from 'node:path';

function findInTools(filenames) {
  const root = fileURLToPath(toolsDir);
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
      const p = join(cur, ent.name);
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
    name: 'wkhtmltox (portable binary or installer)',
    check: () =>
      findInTools([
        'wkhtmltoimage.exe',
        'wkhtmltoimage',
        'wkhtmltopdf.exe',
        'wkhtmltopdf',
        'wkhtmltox-0.12.6-1.msvc2015-win64.exe',
      ]),
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
