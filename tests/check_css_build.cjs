#!/usr/bin/env node
// simple validation that build:css inlines all partial imports
const { execSync } = require('child_process');
const { readFileSync } = require('fs');

try {
  console.log('running build:css...');
  execSync('npm run build:css', { stdio: 'inherit' });
  const out = readFileSync('public/assets/css/main.css', 'utf-8');
  if (/\@import\s+url\(['\"]?partials\//.test(out)) {
    console.error('✗ build output still contains partial imports');
    process.exit(1);
  }
  if (out.indexOf('sourceMappingURL') !== -1) {
    console.error('✗ build output contains a source map reference');
    process.exit(1);
  }
  console.log('✓ build output contains no @import from partials and no source map');
} catch (e) {
  console.error('error during css build check', e);
  process.exit(1);
}
